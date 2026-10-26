# Geometry Dash Custom

Кастомная браузерная игра Geometry Dash с редактором уровней и упаковкой в Windows `.exe`.

## Быстрый запуск в браузере

Нужен Node.js 20 или новее.

```bash
npm install
npm run dev
```

## Собрать Windows EXE локально

На Windows запусти `BUILD-EXE.bat`, либо выполни:

```bash
npm install
npm run dist:win
```

Готовый установщик появится в папке `release/`.

## Сборка через GitHub Actions

1. Создай пустой репозиторий на GitHub.
2. Распакуй этот проект и открой терминал в папке `geometry-dash`.
3. Выполни команды (замени URL на адрес своего репозитория):

```bash
git init
git add .
git commit -m "Prepare Geometry Dash project"
git branch -M main
git remote add origin https://github.com/USERNAME/REPOSITORY.git
git push -u origin main
```

4. На GitHub открой вкладку **Actions**. Workflow **Build Windows EXE** автоматически соберёт игру на Windows.
5. Открой завершённый запуск workflow и скачай файл из раздела **Artifacts**.

### Создать GitHub Release с EXE

После push на `main` можно скачать EXE из Artifacts. Чтобы создать релиз, выполни:

```bash
git tag v1.0.0
git push origin v1.0.0
```

После успешной сборки установщик автоматически прикрепится к GitHub Release с тегом `v1.0.0`.

## Важно

- Git сам по себе не собирает EXE: сборку выполняет GitHub Actions на Windows runner.
- Первый запуск сборки может занять несколько минут, пока скачиваются npm-зависимости и Electron.
- Если репозиторий публичный, исходный код и выпуски будут доступны всем, кто имеет ссылку.
