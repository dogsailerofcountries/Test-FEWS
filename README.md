# FEWS Web Nuevo

Implementacion ligera del nuevo FEWS Web con:

- API demo en Python sin dependencias externas
- sincronizacion periodica de snapshots FEWS
- UI bilingue en espanol e ingles
- script opcional de validacion con Playwright en Python

## Ejecutar

```powershell
python server.py
```

Luego abre `http://127.0.0.1:8000`

La UI consume una API demo propia. Esa API sincroniza snapshots de FEWS en segundo plano y sirve respuestas ya procesadas al frontend.

## Sincronizar manualmente

```powershell
python scripts/sync_now.py
```

## Playwright en Python

```powershell
pip install playwright
python -m playwright install
python scripts/playwright_validate.py http://127.0.0.1:8000
```
