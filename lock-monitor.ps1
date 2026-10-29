Add-Type -AssemblyName System.Windows.Forms

$handler = [Microsoft.Win32.SessionSwitchEventHandler] {
    param($sender, $eventArgs)
    if ($eventArgs.Reason -eq [Microsoft.Win32.SessionSwitchReason]::SessionLock) {
        [Console]::WriteLine("LOCK")
        [Console]::Out.Flush()
    }
}

[Microsoft.Win32.SystemEvents]::add_SessionSwitch($handler)
try {
    while ($true) { Start-Sleep -Seconds 1 }
}
finally {
    [Microsoft.Win32.SystemEvents]::remove_SessionSwitch($handler)
}
