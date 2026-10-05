# WEB-EX

**Экзаменационная работа по веб-программированию**

Веб-приложение образовательной платформы с гибридной архитектурой (TypeScript + Rust) и ролевой системой доступа.

---

## 📋 О проекте

Приложение реализует полноценную образовательную платформу с разделением ролей и взаимодействием клиентской и серверной части через REST API. Сервер предоставляет функционал для:

- 🔐 Регистрации и аутентификации пользователей
- 👥 Разграничения ролей: студент, преподаватель, администратор
- 📚 Создания и ведения курсов и учебных групп
- 📝 Системы заданий, тестов и попыток их прохождения
- 📊 Отслеживания прогресса и результатов обучения
- 📁 Загрузки файлов и комментариев к работам

---

## 🗂 Структура проекта

```
WEB-EX/
├── src/
│   ├── handlers/              # Обработчики HTTP-запросов (Rust)
│   │   ├── answer.rs          # Обработка ответов на тесты
│   │   ├── course.rs          # Эндпоинты работы с курсами
│   │   ├── mod.rs             # Модульная сборка хендлеров
│   │   ├── teacher.rs         # Функционал преподавателя
│   │   └── user.rs            # Управление пользователями и файлами
│   ├── auth.ts                # Логика аутентификации (TypeScript)
│   ├── register.ts            # Регистрация новых пользователей
│   ├── course.ts              # Бизнес-логика курсов
│   ├── user-info.ts           # Получение данных профиля
│   ├── main.rs                # Точка входа Actix Web-сервера
│   ├── models.rs              # Модели данных (Serde)
│   └── state.rs               # Глобальное состояние приложения
├── static/                    # Статические файлы фронтенда
│   ├── css/                   # Стили интерфейса
│   ├── dist/                  # Скомпилированный TypeScript → JavaScript
│   ├── index.html             # Страница входа
│   ├── register.html          # Страница регистрации
│   ├── mainpage.html          # Главная страница студента
│   ├── mainpageTeacher.html   # Главная страница преподавателя
│   └── course.html            # Страница курса
├── Creat.sql                  # DDL-схема БД (таблицы, функции, триггеры)
├── Insert.sql                 # Начальные данные для тестирования
├── package.json               # Зависимости TypeScript
├── tsconfig.json              # Конфигурация компилятора TS
├── Cargo.toml                 # Зависимости Rust-проекта
├── Cargo.lock                 # Lock-файл зависимостей Rust
└── postgres - WEB - base.png  # ER-диаграмма базы данных
```

---

## 🛠 Технологический стек

| Компонент | Технология / Версия |
|---|---|
| Языки | TypeScript, Rust, JavaScript |
| Web-фреймворк | Actix Web (Rust) |
| База данных | PostgreSQL с PL/pgSQL функциями |
| ORM / Query | SQLx с async-поддержкой |
| Сериализация | Serde + serde_json |
| Асинхронность | Tokio runtime |
| Работа с файлами | actix-files, actix-multipart |
| Утилиты | chrono, uuid, dotenvy, env_logger |
| Сборка фронтенда | TypeScript Compiler (`tsc`) |

---

## ⚙️ Быстрый старт

### 1. Клонирование и переход в папку

```bash
git clone https://github.com/lxnwo/Web-Ex.git
cd Web-Ex
```

### 2. Настройка переменных окружения

Создайте файл `.env` в корне проекта:

```
DATABASE_URL_PUBLIC=postgres://publicUser:1@localhost/WEB
DATABASE_URL_STUDENT=postgres://studentUser:1@localhost/WEB
```

### 3. Подготовка базы данных

> Если забыт пароль суперпользователя `postgres` — сначала сбросьте его (раздел «3.1 Сброс пароля postgres» ниже).

**Шаг 1 — создайте базу и роли.** Роли нужны **до** `Creat.sql`, потому что внутри него есть `GRANT ... TO admin/publicUser/studentUser`:

```powershell
psql -U postgres -c "CREATE DATABASE \"WEB\";"
psql -U postgres -c "CREATE ROLE admin LOGIN PASSWORD 'admin';"
psql -U postgres -c "CREATE ROLE \"publicUser\" LOGIN PASSWORD '1';"
psql -U postgres -c "CREATE ROLE \"studentUser\" LOGIN PASSWORD '1';"
```

> Если какая-то роль уже существует — пропустите соответствующую команду.

**Шаг 2 — примените схему и данные:**

```powershell
psql -U postgres -d WEB -f Creat.sql
psql -U postgres -d WEB -f Insert.sql
```

- `Creat.sql` — схема `base`, таблицы и функции (нужен суперпользователь: внутри `CREATE EXTENSION pgcrypto`).
- `Insert.sql` — тестовые пользователи (пароль у всех `12345`).

### 3.1 Сброс пароля postgres (если забыт)

1. Откройте `D:\programs\PostgreSQL\data\pg_hba.conf` в Блокноте **от имени администратора**.
2. В активных строках замените `scram-sha-256` на `trust`:

   ```
   local   all             all                                     trust
   host    all             all             127.0.0.1/32            trust
   host    all             all             ::1/128                 trust
   ```

3. Сохраните файл и перезапустите службу (PowerShell **от администратора**):

   ```powershell
   Restart-Service postgresql-x64-17
   ```

4. Задайте новый пароль:

   ```powershell
   & 'D:\programs\PostgreSQL\bin\psql.exe' -U postgres -d postgres -c "ALTER USER postgres PASSWORD 'НОВЫЙ_ПАРОЛЬ';"
   ```

5. Верните `trust` обратно на `scram-sha-256`, сохраните и снова:

   ```powershell
   Restart-Service postgresql-x64-17
   ```

### 4. Установка зависимостей

```bash
# TypeScript-зависимости
npm install

# Rust (stable toolchain)
rustup install stable
```

### 5. Сборка и запуск

```bash
# Сборка Rust-проекта
cargo build

# Запуск сервера
cargo run
# или напрямую исполняемый файл:
./target/release/actix_users_db
```

Сервер будет доступен по адресу: **http://localhost:8080**

---

## 🗄 Архитектура базы данных

### Основные сущности

```
users          → профили всех пользователей
├─ student     → данные студентов
├─ teacher     → данные преподавателей
└─ admin       → данные администраторов

cours / groups → учебные курсы и группы
├─ inventory   → учебные материалы
├─ task        → задания и тесты
│  ├─ question       → вопросы теста
│  ├─ answer_option  → варианты ответов
│  └─ taskresult     → результаты выполнения

file / comment / validation → вложения, комментарии, проверка работ
```

---

## 🔐 Система прав доступа

Проект использует ролевое разграничение на уровне БД:

| Роль пользователя | БД-пользователь | Доступ |
|---|---|---|
| Гость / Регистрация | `publicUser` | Только `auth_*`, `register_*` функции |
| Студент | `studentUser` | Чтение курсов, отправка ответов, свои результаты |
| Преподаватель | `teacher` (через app logic) | Управление заданиями, проверка работ, аналитика |
| Администратор | `postgres` / `admin` | Полный доступ ко всем объектам БД |

> 💡 Все бизнес-операции выполняются через хранимые функции PostgreSQL, что обеспечивает централизованную валидацию и аудит.

---

## 📡 Основные эндпоинты API

### Аутентификация

```
POST /api/auth/login
POST /api/auth/register
```

### Пользователи

```
GET  /api/user/me
PUT  /api/user/profile
```

### Курсы

```
GET  /api/courses
POST /api/courses          # (преподаватель/админ)
GET  /api/courses/:id
```

### Задания и тесты

```
GET  /api/tasks/:course_id
POST /api/tasks/submit
GET  /api/tasks/:id/results
```

### Файлы

```
POST /api/files/upload
GET  /api/files/:id
```

---

## 🧪 Запуск и проверка

```bash
# Запуск сервера
cargo run

# Проверка доступности
curl http://localhost:8080
```

Откройте в браузере **http://localhost:8080** — откроется страница входа в систему.

---

## 📄 Лицензия

Проект создан в рамках экзаменационной работы по дисциплине «Веб-программирование».
Исходный код распространяется под лицензией MIT — используйте с указанием авторства.

Copyright © 2026 lxnwo