# Removes development requirement tags (TR-PAT-001, FR-EMR-004, "TR-REP-001 -> TR-REP-005", "(TR-...)")
# from the frontend screens. Makes a backup first, then lists anything that still needs a manual look.
# Run from the repo root:  powershell -ExecutionPolicy Bypass -File scripts\strip-dev-tags.ps1
$root   = Split-Path -Parent $PSScriptRoot
$src    = Join-Path $root 'frontend\src'
$backup = Join-Path $root 'frontend\src-backup-before-tag-strip'
if (-not (Test-Path $backup)) { Copy-Item $src $backup -Recurse }

$tag = '\b[TF]R-[A-Z]{2,5}-\d{3}\b'
$changed = 0
$files = Get-ChildItem $src -Recurse -Include *.tsx,*.ts | Where-Object { $_.Name -notmatch '\.test\.' }
foreach ($f in $files) {
  $t = [IO.File]::ReadAllText($f.FullName)
  $o = $t
  # 1) a parenthesis that contains a tag, e.g. " (TR-EMR-004)" or " (SRS Compliant (TR-PAT-001 through TR-PAT-005))"
  $t = [regex]::Replace($t, "\s*\((?:[^()]*?)$tag(?:[^()]*?)\)", '')
  # 2) tag ranges / lists:  TR-A-001 -> TR-A-005,  TR-A-001 & TR-A-002,  TR-A-001 through TR-A-005
  $t = [regex]::Replace($t, "$tag(\s*(?:through|and|to|&|[^\sA-Za-z0-9<>{}]{1,4})\s*$tag)*", '')
  # 3) citation leftovers like  [cite: 3, 18]
  $t = [regex]::Replace($t, '\s*\[cite:[^\]]*\]', '')
  if ($t -ne $o) { [IO.File]::WriteAllText($f.FullName, $t, (New-Object Text.UTF8Encoding $false)); $changed++ ; "cleaned  $($f.FullName.Replace($root + '\',''))" }
}
"`n$changed file(s) changed. Backup of the originals: frontend\src-backup-before-tag-strip (delete it when happy)."

"`n--- Lines that still need a human look (labels left behind, empty badges) ---"
Get-ChildItem $src -Recurse -Include *.tsx | Where-Object { $_.Name -notmatch '\.test\.' } |
  Select-String -Pattern 'SRS Compliant|Compliant|[TF]R-[A-Z]{2,5}-\d{3}|cite:|Development|DEV ' |
  ForEach-Object { "{0}:{1}: {2}" -f $_.Path.Replace($root + '\',''), $_.LineNumber, $_.Line.Trim() }
