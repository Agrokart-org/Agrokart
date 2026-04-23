$src = "c:\Users\ASUS\OneDrive\Desktop\Agrokart\client\build\images\products"
$dst = "c:\Users\ASUS\OneDrive\Desktop\Agrokart\client\src\assets\products"

# Step 1: Clear destination subdirectories
Write-Host "Clearing old assets..."
Get-ChildItem -Path $dst -Directory -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force

# Step 2: Copy all category subfolders (not loose root files)
Write-Host "Copying category folders..."
Get-ChildItem -Path $src -Directory | ForEach-Object { 
    Copy-Item -Path $_.FullName -Destination $dst -Recurse -Force 
    Write-Host "  Copied: $($_.Name)"
}

# Step 3: Rename problematic files for clean webpack imports
Write-Host "Renaming files..."

# Urea folder
$ureaDir = Join-Path $dst "Urea"
Get-ChildItem -LiteralPath $ureaDir -Filter "61JHI*" -ErrorAction SilentlyContinue | Rename-Item -NewName "IFFCO Urea.jpg"
Get-ChildItem -LiteralPath $ureaDir -Filter "npk-10-26-26*" -ErrorAction SilentlyContinue | Rename-Item -NewName "NFL Neem Coated Urea.webp"
Get-ChildItem -LiteralPath $ureaDir -Filter "ujwala*" -ErrorAction SilentlyContinue | Rename-Item -NewName "Ujwala Neem Coated Urea.avif"

# Micronutrients folder
$microDir = Join-Path $dst "Micronutrients"
Get-ChildItem -LiteralPath $microDir -Filter "Zinc Sulphate*" -ErrorAction SilentlyContinue | Rename-Item -NewName "Zinc Sulphate 21.jpg"
Get-ChildItem -LiteralPath $microDir -Filter "ferrous-sulphate*" -ErrorAction SilentlyContinue | Rename-Item -NewName "Ferrous Sulphate Granular.jpg"

# Tools folder
$toolsDir = Join-Path $dst "Tools"
Get-ChildItem -LiteralPath $toolsDir -Filter "Fertilizer Planter*" -ErrorAction SilentlyContinue | Rename-Item -NewName "Seed Planting Machine.webp"
Get-ChildItem -LiteralPath $toolsDir -Filter "Three teeth*" -ErrorAction SilentlyContinue | Rename-Item -NewName "Three Teeth Cultivator.jpg"

# NPK Fertilizers folder
$npkDir = Join-Path $dst "NPK Fertilizers"
Get-ChildItem -LiteralPath $npkDir -Filter "F1571*" -ErrorAction SilentlyContinue | Rename-Item -NewName "Sujala NPK.png"

# Pesticides folder
$pestDir = Join-Path $dst "Pesticides"
Get-ChildItem -LiteralPath $pestDir -Filter "Monocrotophos-*" -ErrorAction SilentlyContinue | Rename-Item -NewName "Monocrotophos 36 SL.jpg"

# Seeds folder
$seedsDir = Join-Path $dst "Seeds"
Get-ChildItem -LiteralPath $seedsDir -Filter "Advanta corn*" -ErrorAction SilentlyContinue | Rename-Item -NewName "Advanta Corn Seeds.jpg"
Get-ChildItem -LiteralPath $seedsDir -Filter "kaveri wheet*" -ErrorAction SilentlyContinue | Rename-Item -NewName "Kaveri Wheat Seeds.jpeg"
Get-ChildItem -LiteralPath $seedsDir -Filter "cucumber seeds*" -ErrorAction SilentlyContinue | Rename-Item -NewName "Cucumber Seeds.jpeg"
Get-ChildItem -LiteralPath $seedsDir -Filter "lady finger*" -ErrorAction SilentlyContinue | Rename-Item -NewName "Lady Finger Seeds.jpeg"
Get-ChildItem -LiteralPath $seedsDir -Filter "tomato seeds*" -ErrorAction SilentlyContinue | Rename-Item -NewName "Tomato Seeds.jpeg"

# Bio-Fertilizers folder
$bioDir = Join-Path $dst "Bio-Fertilizers"
Get-ChildItem -LiteralPath $bioDir -Filter "azospirillium*" -ErrorAction SilentlyContinue | Rename-Item -NewName "Azospirillum Biofertilizer.webp"
Get-ChildItem -LiteralPath $bioDir -Filter "jivanu*" -ErrorAction SilentlyContinue | Rename-Item -NewName "Jivanu Biofertilizer.jpg"

Write-Host "`nFinal structure:"
Get-ChildItem -Path $dst -Recurse -File | ForEach-Object {
    $rel = $_.FullName.Substring($dst.Length + 1)
    Write-Host "  $rel"
}
Write-Host "`nDone! Total files: $((Get-ChildItem -Path $dst -Recurse -File).Count)"
