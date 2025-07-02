# Пошаговые инструкции для запуска CI/CD

## 🚀 Готово к запуску!

Ваш CI/CD пайплайн практически готов. Вот что нужно сделать:

### 1. Убедитесь, что все файлы на месте ✅

```bash
# Проверим основные файлы
ls -la .github/workflows/
ls -la package-lock.json
ls -la Dockerfile
```

### 2. Зафиксируйте изменения в Git

```bash
# Добавить все файлы CI/CD
git add .github/
git add Dockerfile
git add .dockerignore
git add package-lock.json
git add *.md
git add local-build.sh

# Сделать коммит
git commit -m "feat: add complete CI/CD pipeline with GitHub Actions

- Add Docker-based Linux builds
- Add Windows and macOS build support
- Add automated testing workflows
- Add security scanning and code quality checks
- Add automated release creation
- Add comprehensive documentation"

# Отправить в репозиторий
git push origin main
```

### 3. Что произойдет автоматически 🤖

После `git push origin main`:

1. **Запустятся workflow'ы:**
   - ✅ Code Quality Check
   - ✅ Automated Testing  
   - ✅ Build and Release (сборка для Linux и Windows)

2. **В Actions увидите:**
   - 🐧 Linux build (в Docker)
   - 🪟 Windows build 
   - 🧪 Tests на разных платформах
   - 🔒 Security scans

### 4. Создание релиза 🎁

Для создания релиза с установочными файлами:

**Вариант А: Автоматический (рекомендуется)**
1. Идите в GitHub → Actions → "Version Bump and Tag"
2. Нажмите "Run workflow"
3. Выберите тип версии (patch/minor/major)
4. Запустите - автоматически создастся релиз

**Вариант Б: Ручной**
```bash
npm version patch  # или minor, major
git push origin main --tags
```

### 5. Мониторинг 📊

Следите за сборкой в:
- **GitHub Actions** → вкладка Actions
- **Artifacts** будут доступны для скачивания
- **Releases** появятся автоматически при тегах

### 6. Что получите 📦

После успешной сборки:

**Linux пакеты:**
- `*.AppImage` - универсальный пакет
- `*.deb` - для Ubuntu/Debian
- `*.rpm` - для RedHat/Fedora  
- `*.tar.gz` - архив

**Windows пакеты:**
- `*.exe` - NSIS установщик
- `*-portable.exe` - портативная версия
- `*.zip` - архив

### 7. Локальное тестирование 🧪

Если хотите протестировать локально:

```bash
# Сделать исполняемым
chmod +x local-build.sh

# Собрать для текущей платформы
./local-build.sh linux

# Собрать для всех платформ
./local-build.sh all
```

### 8. Возможные проблемы и решения 🔧

**Если сборка упадет:**

1. **Проверьте логи** в GitHub Actions
2. **Отсутствует package-lock.json?**
   ```bash
   npm install  # создаст package-lock.json
   git add package-lock.json
   git commit -m "add package-lock.json"
   git push
   ```

3. **Docker проблемы?**
   - Проверьте Dockerfile syntax
   - Тестируйте локально: `docker build -t test .`

4. **Ошибки зависимостей?**
   ```bash
   npm audit fix
   npm update
   ```

### 9. Первый запуск ⚡

```bash
# ИТАК, ЗАПУСКАЕМ:
git add .
git commit -m "feat: complete CI/CD setup"
git push origin main

# Затем наблюдайте в GitHub Actions!
```

## 🎯 Готово к запуску!

Как только сделаете `git push`, все заработает автоматически! 

**Следующие шаги после успешного пуша:**
1. Идите в GitHub → Actions
2. Смотрите процесс сборки
3. Если все ОК → создайте первый релиз
4. Скачайте и протестируйте пакеты

Удачи! 🚀
