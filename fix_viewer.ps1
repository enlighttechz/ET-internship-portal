$f = 'd:\Projects\ET internship\lms\frontend\src\components\CourseViewer.jsx'
$lines = [System.IO.File]::ReadAllLines($f)
$out = $lines[0..937] + $lines[1175..($lines.Length - 1)]
[System.IO.File]::WriteAllLines($f, $out)
Write-Host "Done. Lines: $($out.Length)"
