const http=require('http');
const fs=require('fs');
const path=require('path');
const {spawn}=require('child_process');
const readline=require('readline');

const HOST='127.0.0.1';
const PORT=4173;
const ROOT=__dirname;
const DATA_FILE=path.join(ROOT,'focuslog-data.json');
const TEMP_FILE=path.join(ROOT,'focuslog-data.tmp.json');
const BACKUP_FILE=path.join(ROOT,'focuslog-data.backup.json');
const STATUS_FILE=path.join(ROOT,'focuslog-status.json');
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8'};
let lastLockAt=(()=>{try{return Number(JSON.parse(fs.readFileSync(STATUS_FILE,'utf8')).lastLockAt)||0}catch{return 0}})();
let lockMonitor=null;

if(process.platform==='win32'){
  lockMonitor=spawn('powershell',['-NoProfile','-ExecutionPolicy','Bypass','-File',path.join(ROOT,'lock-monitor.ps1')],{windowsHide:true,stdio:['ignore','pipe','ignore']});
  const lines=readline.createInterface({input:lockMonitor.stdout});
  lines.on('line',line=>{if(line.trim()==='LOCK'){lastLockAt=Date.now();fs.writeFileSync(STATUS_FILE,JSON.stringify({lastLockAt},null,2),'utf8')}});
}
process.on('exit',()=>{if(lockMonitor)lockMonitor.kill()});

function emptyData(){return {records:[],notes:{},todos:[],updatedAt:0}}
function readData(){try{const parsed=JSON.parse(fs.readFileSync(DATA_FILE,'utf8'));return {records:Array.isArray(parsed.records)?parsed.records:[],notes:parsed.notes&&typeof parsed.notes==='object'?parsed.notes:{},todos:Array.isArray(parsed.todos)?parsed.todos:[],updatedAt:Number(parsed.updatedAt)||0}}catch{return emptyData()}}
function writeData(data){const next={records:data.records,notes:data.notes,todos:Array.isArray(data.todos)?data.todos:[],updatedAt:Date.now()};if(fs.existsSync(DATA_FILE))fs.copyFileSync(DATA_FILE,BACKUP_FILE);fs.writeFileSync(TEMP_FILE,JSON.stringify(next,null,2),'utf8');fs.renameSync(TEMP_FILE,DATA_FILE);return next}
function json(res,status,data){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'Content-Type','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Cache-Control':'no-store'});res.end(JSON.stringify(data))}

const server=http.createServer((req,res)=>{
  const url=new URL(req.url,`http://${HOST}:${PORT}`);
  if(req.method==='OPTIONS'){res.writeHead(204,{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'Content-Type','Access-Control-Allow-Methods':'GET,POST,OPTIONS'});return res.end()}
  if(url.pathname==='/api/status'&&req.method==='GET')return json(res,200,{lastLockAt,monitorRunning:Boolean(lockMonitor&&lockMonitor.exitCode===null)});
  if(url.pathname==='/api/data'&&req.method==='GET')return json(res,200,readData());
  if(url.pathname==='/api/data'&&req.method==='POST'){
    let body='';
    req.on('data',chunk=>{body+=chunk;if(body.length>5_000_000)req.destroy()});
    req.on('end',()=>{try{const input=JSON.parse(body);if(!Array.isArray(input.records)||!input.notes||typeof input.notes!=='object')return json(res,400,{error:'Invalid data'});const current=readData(),recordMap=new Map(current.records.map(r=>[String(r.id),r])),todoMap=new Map(current.todos.map(t=>[String(t.id),t]));input.records.forEach(r=>{const old=recordMap.get(String(r.id));if(!old||(r.updatedAt||0)>=(old.updatedAt||0))recordMap.set(String(r.id),r)});(Array.isArray(input.todos)?input.todos:[]).forEach(t=>{const old=todoMap.get(String(t.id));if(!old||(t.updatedAt||t.createdAt||0)>=(old.updatedAt||old.createdAt||0))todoMap.set(String(t.id),t)});const saved=writeData({records:[...recordMap.values()].sort((a,b)=>b.start-a.start),notes:{...current.notes,...input.notes},todos:[...todoMap.values()].sort((a,b)=>a.createdAt-b.createdAt)});json(res,200,{ok:true,updatedAt:saved.updatedAt})}catch{return json(res,400,{error:'Invalid JSON'})}});
    return;
  }
  const relative=url.pathname==='/'?'index.html':decodeURIComponent(url.pathname.slice(1));
  const file=path.resolve(ROOT,relative);
  if(!file.startsWith(ROOT)||!fs.existsSync(file)||fs.statSync(file).isDirectory()){res.writeHead(404);return res.end('Not found')}
  res.writeHead(200,{'Content-Type':MIME[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});
  fs.createReadStream(file).pipe(res);
});

const appUrl=`http://${HOST}:${PORT}`;
function openApp(){if(process.platform==='win32'&&!process.env.FOCUSLOG_NO_OPEN)spawn('cmd',['/c','start','',appUrl],{detached:true,stdio:'ignore',windowsHide:true}).unref()}
server.on('error',error=>{
  if(error.code==='EADDRINUSE'){
    console.log(`Focuslog 已在运行：${appUrl}`);
    openApp();
    setTimeout(()=>process.exit(0),300);
    return;
  }
  throw error;
});
server.listen(PORT,HOST,()=>{
  const url=appUrl;
  console.log(`Focuslog 已启动：${url}`);
  openApp();
});
