# Script para testar validação de categoria duplicada
# Execute este script após iniciar o backend com: npm run start:dev

Write-Host "=== Teste de Validação de Categoria Duplicada ===" -ForegroundColor Cyan

$baseUrl = "http://localhost:3000"
$categoryName = "Bebidas_$(Get-Random)"

Write-Host "`n1. Criando primeira categoria: $categoryName" -ForegroundColor Yellow
$response1 = Invoke-RestMethod -Method Post `
  -Uri "$baseUrl/categories" `
  -ContentType 'application/json' `
  -Body (@{ name = $categoryName } | ConvertTo-Json) `
  -ErrorAction Continue

if ($response1) {
  Write-Host "✓ Categoria criada com sucesso!" -ForegroundColor Green
  Write-Host "  ID: $($response1.id)"
  Write-Host "  Nome: $($response1.name)"
} else {
  Write-Host "✗ Falha ao criar categoria" -ForegroundColor Red
  exit 1
}

Write-Host "`n2. Tentando criar categoria com mesmo nome (deve falhar)..." -ForegroundColor Yellow

try {
  $response2 = Invoke-RestMethod -Method Post `
    -Uri "$baseUrl/categories" `
    -ContentType 'application/json' `
    -Body (@{ name = $categoryName } | ConvertTo-Json) `
    -ErrorAction Stop

  Write-Host "✗ ERRO: A API aceitou categoria duplicada (deveria ter rejeitado)" -ForegroundColor Red
  exit 1
} catch {
  $statusCode = $_.Exception.Response.StatusCode.Value__
  $errorBody = $_.ErrorDetails.Message | ConvertFrom-Json

  if ($statusCode -eq 409) {
    Write-Host "✓ Erro 409 (Conflict) retornado corretamente!" -ForegroundColor Green
    Write-Host "  Mensagem: $($errorBody.message)"
  } else {
    Write-Host "✗ Erro inesperado: Status $statusCode" -ForegroundColor Red
    Write-Host "  Resposta: $($errorBody | ConvertTo-Json)"
    exit 1
  }
}

Write-Host "`n3. Criando categoria com nome diferente (deve funcionar)..." -ForegroundColor Yellow
$categoryName2 = "Comidas_$(Get-Random)"

$response3 = Invoke-RestMethod -Method Post `
  -Uri "$baseUrl/categories" `
  -ContentType 'application/json' `
  -Body (@{ name = $categoryName2 } | ConvertTo-Json) `
  -ErrorAction Continue

if ($response3) {
  Write-Host "✓ Segunda categoria criada com sucesso!" -ForegroundColor Green
  Write-Host "  ID: $($response3.id)"
  Write-Host "  Nome: $($response3.name)"
} else {
  Write-Host "✗ Falha ao criar segunda categoria" -ForegroundColor Red
  exit 1
}

Write-Host "`n4. Listando todas as categorias..." -ForegroundColor Yellow
$allCategories = Invoke-RestMethod -Method Get `
  -Uri "$baseUrl/categories" `
  -ContentType 'application/json'

Write-Host "✓ Encontradas $($allCategories.Count) categorias:" -ForegroundColor Green
$allCategories | ForEach-Object {
  Write-Host "  - ID $($_.id): $($_.name)"
}

Write-Host "`n=== TESTES PASSARAM COM SUCESSO! ===" -ForegroundColor Green

