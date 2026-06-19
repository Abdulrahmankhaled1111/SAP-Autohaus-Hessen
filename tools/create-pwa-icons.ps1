Add-Type -AssemblyName System.Drawing

$iconsDir = Join-Path $PSScriptRoot "..\assets\icons"
New-Item -ItemType Directory -Force -Path $iconsDir | Out-Null

function New-AutohausIcon {
  param(
    [int]$Size,
    [string]$FileName,
    [bool]$Maskable = $false
  )

  $bitmap = New-Object System.Drawing.Bitmap $Size, $Size
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

  $blue = [System.Drawing.Color]::FromArgb(15, 106, 180)
  $darkBlue = [System.Drawing.Color]::FromArgb(8, 74, 126)
  $white = [System.Drawing.Color]::White
  $light = [System.Drawing.Color]::FromArgb(226, 239, 249)

  $graphics.Clear($blue)

  if (-not $Maskable) {
    $radius = [Math]::Round($Size * 0.18)
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $rect = New-Object System.Drawing.RectangleF(0, 0, $Size, $Size)
    $diameter = $radius * 2
    $path.AddArc($rect.X, $rect.Y, $diameter, $diameter, 180, 90)
    $path.AddArc($rect.Right - $diameter, $rect.Y, $diameter, $diameter, 270, 90)
    $path.AddArc($rect.Right - $diameter, $rect.Bottom - $diameter, $diameter, $diameter, 0, 90)
    $path.AddArc($rect.X, $rect.Bottom - $diameter, $diameter, $diameter, 90, 90)
    $path.CloseFigure()
    $graphics.SetClip($path)
    $graphics.Clear($blue)
  }

  $scale = $Size / 512.0

  function F([double]$Value) {
    return [single]($Value * $scale)
  }

  $shadowBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(36, 0, 0, 0))
  $graphics.FillEllipse($shadowBrush, (F 121), (F 357), (F 270), (F 32))

  $carBrush = New-Object System.Drawing.SolidBrush($white)
  $accentBrush = New-Object System.Drawing.SolidBrush($light)
  $wheelBrush = New-Object System.Drawing.SolidBrush($darkBlue)

  $roof = @(
    (New-Object System.Drawing.PointF((F 150), (F 282))),
    (New-Object System.Drawing.PointF((F 214), (F 190))),
    (New-Object System.Drawing.PointF((F 306), (F 190))),
    (New-Object System.Drawing.PointF((F 372), (F 282)))
  )
  $graphics.FillPolygon($carBrush, $roof)

  $window = @(
    (New-Object System.Drawing.PointF((F 194), (F 256))),
    (New-Object System.Drawing.PointF((F 228), (F 205))),
    (New-Object System.Drawing.PointF((F 294), (F 205))),
    (New-Object System.Drawing.PointF((F 329), (F 256)))
  )
  $graphics.FillPolygon($accentBrush, $window)

  $graphics.FillRectangle($carBrush, (F 88), (F 282), (F 336), (F 84))
  $graphics.FillRectangle($carBrush, (F 118), (F 254), (F 277), (F 46))

  $pen = New-Object System.Drawing.Pen($blue, [Math]::Max(8, (F 13)))
  $pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  $graphics.DrawLine($pen, (F 257), (F 204), (F 257), (F 256))
  $graphics.DrawLine($pen, (F 122), (F 324), (F 390), (F 324))

  $graphics.FillEllipse($wheelBrush, (F 137), (F 344), (F 58), (F 58))
  $graphics.FillEllipse($wheelBrush, (F 317), (F 344), (F 58), (F 58))
  $graphics.FillEllipse($carBrush, (F 153), (F 360), (F 26), (F 26))
  $graphics.FillEllipse($carBrush, (F 333), (F 360), (F 26), (F 26))

  $fontSize = [Math]::Max(36, (F 72))
  $font = New-Object System.Drawing.Font("Arial", $fontSize, [System.Drawing.FontStyle]::Bold)
  $textBrush = New-Object System.Drawing.SolidBrush($white)
  $format = New-Object System.Drawing.StringFormat
  $format.Alignment = [System.Drawing.StringAlignment]::Center
  $format.LineAlignment = [System.Drawing.StringAlignment]::Center
  $textRect = New-Object System.Drawing.RectangleF([single]0, (F 68), [single]$Size, (F 82))
  $graphics.DrawString("AH", $font, $textBrush, $textRect, $format)

  $pathOut = Join-Path $iconsDir $FileName
  $bitmap.Save($pathOut, [System.Drawing.Imaging.ImageFormat]::Png)

  $graphics.Dispose()
  $bitmap.Dispose()
}

New-AutohausIcon -Size 192 -FileName "icon-192.png"
New-AutohausIcon -Size 512 -FileName "icon-512.png"
New-AutohausIcon -Size 512 -FileName "maskable-512.png" -Maskable $true
