# Collects the auth/RBAC code and a route inventory into project-dump.txt (do not commit it).
# Run from the repo root:  powershell -ExecutionPolicy Bypass -File scripts\collect-for-claude.ps1
$root = Split-Path -Parent $PSScriptRoot
$out  = Join-Path $root 'project-dump.txt'
Set-Content $out '' -Encoding UTF8
function Add-File($p) { if (Test-Path $p) { "===== " + $p.Replace($root + '\','') | Add-Content $out -Encoding UTF8; Get-Content $p | Add-Content $out -Encoding UTF8 } }
foreach ($d in 'backend\src\auth','backend\src\users','backend\src\database','backend\src\common') {
  $full = Join-Path $root $d
  if (Test-Path $full) { Get-ChildItem $full -Recurse -File -Include *.ts | Where-Object { $_.Name -notmatch 'spec' } | ForEach-Object { Add-File $_.FullName } }
}
Add-File (Join-Path $root 'backend\src\app.module.ts')
Add-File (Join-Path $root 'backend\src\main.ts')
"===== ROUTE INVENTORY (controller decorators)" | Add-Content $out -Encoding UTF8
Get-ChildItem (Join-Path $root 'backend\src') -Recurse -Filter *.controller.ts | ForEach-Object {
  "--- " + $_.FullName.Replace($root + '\','') | Add-Content $out -Encoding UTF8
  Select-String -Path $_.FullName -Pattern "@(Controller|Get|Post|Put|Patch|Delete|RequirePermissions)\(" | ForEach-Object { $_.Line.Trim() } | Add-Content $out -Encoding UTF8
}
"===== TREE backend\src" | Add-Content $out -Encoding UTF8
Get-ChildItem (Join-Path $root 'backend\src') -Recurse -File | ForEach-Object { $_.FullName.Replace($root + '\','') } | Add-Content $out -Encoding UTF8
"===== TREE frontend\src" | Add-Content $out -Encoding UTF8
Get-ChildItem (Join-Path $root 'frontend\src') -Recurse -File | Where-Object { $_.FullName -notmatch 'src-backup' } | ForEach-Object { $_.FullName.Replace($root + '\','') } | Add-Content $out -Encoding UTF8
"Wrote $out"
