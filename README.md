# Geometry Dash Custom

Кастомная браузерная игра с редактором уровней и упаковкой в Windows `.exe`.

## Быстрый запуск в браузере

Требуется Node.js 20 или новее.

```bash
npm install
npm run dev
```

## Сборка Windows EXE локально

На Windows запусти `BUILD-EXE.bat` или выполни:

```bash
npm install
npm run dist:win
```

Установщик появится в `release/`.

## Сборка через GitHub Actions

1. На GitHub создай **новый пустой репозиторий** (например, `geometry-dash`). Не добавляй README, `.gitignore` или лицензию на сайте, если проект уже содержит эти файлы.
2. Открой Git Bash в папке проекта — той, где находятся `package.json`, `index.html` и папка `.github`.
3. Проверь, что ты в правильной папке:

   ```bash
   pwd
   ls
   ```

4. Настрой адрес своего репозитория (замени `USERNAME` и `REPOSITORY` на реальные значения):

   ```bash
   git remote -v
   git remote set-url origin https://github.com/USERNAME/REPOSITORY.git
   ```

   Если команда сообщает, что `origin` не существует, используй вместо неё:

   ```bash
   git remote add origin https://github.com/USERNAME/REPOSITORY.git
   ```

5. Отправь проект:

   ```bash
   git add .
   git commit -m "Fix GitHub build setup"
   git branch -M main
   git push -u origin main
   ```

   Если Git сообщает `nothing to commit, working tree clean`, это нормально: просто выполни `git push -u origin main`.

6. На GitHub открой вкладку **Actions** и выбери **Build Windows EXE**. После завершения открой запуск workflow и скачай `Geometry-Dash-Custom-Windows` из раздела **Artifacts**.

### Если видишь `Repository not found`

Обычно URL репозитория неправильный, репозиторий ещё не создан или у аккаунта нет доступа. Открой страницу репозитория в браузере и скопируй URL через **Code → HTTPS**. Адрес вида `https://github.com/USERNAME/REPOSITORY.git` — только пример, его нельзя использовать буквально.

### Создать GitHub Release с EXE

После успешной отправки `main` создай тег и отправь его:

```bash
git tag v1.0.0
git push origin v1.0.0
```

При успешной сборке установщик будет прикреплён к GitHub Release для тега `v1.0.0`.

## Примечания

- Git сам по себе не собирает `.exe`; это делает GitHub Actions на Windows runner.
- Первый запуск может занять несколько минут, так как загружаются npm-пакеты и Electron.
- Для создания GitHub Release workflow требуется разрешение `contents: write`. Если организация ограничивает права workflow, проверь настройки Actions в репозитории.


## Иконка и план улучшений
Смотри `ICON-AND-AUDIT-RU.md`. Иконки лежат в `assets/icons/`, веб-файлы — в `public/`.
