"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};

// === ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ДЛЯ РАБОТЫ С URL ===
function updateUrlAndState(newUrl) {
    const current = window.location.pathname + window.location.search;
    if (current !== newUrl) {
        history.pushState(null, '', newUrl);
    }
}

function restoreStateFromURL() {
    const path = window.location.pathname;
    const search = window.location.search;

    if (path === '/' || (path === '' && !search)) {
        loadCourses();
    } else if (path === '/profile') {
        loadUserInfo();
    } else if (path === '/course') {
        const params = new URLSearchParams(search);
        let paramStr = '';
        for (let [key, value] of params.entries()) {
            paramStr += `&${key}=${encodeURIComponent(value)}`;
        }
        if (paramStr) paramStr = paramStr.substring(1);
        loadTargetCourse(paramStr);
    } else if (path === '/task') {
        const params = new URLSearchParams(search);
        let paramStr = '';
        for (let [key, value] of params.entries()) {
            paramStr += `&${key}=${encodeURIComponent(value)}`;
        }
        if (paramStr) paramStr = paramStr.substring(1);
        loadTargetTask(paramStr);
    } else if (path === '/test') {   // НОВЫЙ БЛОК
        const params = new URLSearchParams(search);
        let paramStr = '';
        for (let [key, value] of params.entries()) {
            paramStr += `&${key}=${encodeURIComponent(value)}`;
        }
        if (paramStr) paramStr = paramStr.substring(1);
        loadTargetTest(paramStr);
    } else if (path === '/test-run') {
        const params = new URLSearchParams(search);
        const testId = params.get('test_id');
        const attemptId = params.get('attempt_id');
        if (testId && attemptId) {
            // Восстановить тест по attempt_id (потребуется дополнительный API)
            // Пока просто показываем сообщение
            document.querySelector('.main-content').innerHTML = '<div class="error">Тест уже начат. Обновление страницы временно не поддерживается.</div>';
        }
    } else {
        loadCourses();
    }
}

// === ГЛОБАЛЬНЫЕ ФУНКЦИИ (доступны из HTML) ===

window.loadCourses = function () {
    const username = localStorage.getItem('username');
    const mainContainer = document.querySelector('.main-content');
    if (!mainContainer) return;

    mainContainer.innerHTML = '<h2>Мои курсы</h2><ul class="course-list"></ul>';

    const navContainer = document.querySelector('.nav-list');
    const coursesContainer = document.querySelector('.course-list');
    if (!navContainer || !coursesContainer) return;

    fetch('/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username || '' })
    })
        .then(res => res.json())
        .then((courses) => {
            // Обновляем навигацию
            navContainer.innerHTML = '<li><a href="#" id="back-to-main">► В начало</a></li>';
            courses.forEach(course => {
                const li = document.createElement('li');
                const a = document.createElement('a');
                a.textContent = course.name;
                a.className = "targetcourse";
                a.id = "targetcourse";
                // Формируем корректный URL с параметрами
                a.href = `?id=${course.id}&name=${encodeURIComponent(course.name)}&description=${encodeURIComponent(course.description)}&start_date=${course.start_date}&end_date=${course.end_date}`;
                li.appendChild(a);
                navContainer.appendChild(li);
            });

            // Обновляем основной список
            coursesContainer.innerHTML = '';
            courses.forEach(course => {
                const li = document.createElement('li');
                const a = document.createElement('a');
                li.id = "coursesContainer";
                a.textContent = course.name;
                a.className = "targetcourse";
                a.id = "targetcourse";
                a.href = `?id=${course.id}&name=${encodeURIComponent(course.name)}&description=${encodeURIComponent(course.description)}&start_date=${course.start_date}&end_date=${course.end_date}`;
                li.appendChild(a);
                coursesContainer.appendChild(li);
                li.innerHTML += `
                    <p>${course.description}</p>
                    <p>Начало: ${course.start_date}</p>
                    <p>Окончание: ${course.end_date}</p>`;
            });

            // Перепривязываем обработчик для кнопки "В начало"
            const backBtn = document.getElementById('back-to-main');
            if (backBtn) {
                backBtn.onclick = (e) => { e.preventDefault(); loadCourses(); };
            }

            // Обновляем URL
            updateUrlAndState('/');
        })
        .catch(err => {
            console.error('Ошибка загрузки курсов:', err);
            if (navContainer) navContainer.innerHTML = '<li>Ошибка загрузки</li>';
            if (coursesContainer) coursesContainer.innerHTML = '<li>Ошибка загрузки</li>';
        });
};

window.loadUserInfo = function () {
    const username = localStorage.getItem('username');
    const mainContainer = document.querySelector('.main-content');
    const errorDiv = document.getElementById('error');

    if (!mainContainer) return;

    if (!username) {
        if (errorDiv) errorDiv.textContent = 'Необходимо войти в систему';
        setTimeout(() => window.location.href = '/', 500);
        return;
    }

    mainContainer.innerHTML = '<div class="loading">Загрузка...</div>';

    fetch('/user-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
    })
        .then(res => {
            if (res.ok) return res.json();
            else if (res.status === 404) throw new Error('not_found');
            else throw new Error('server_error');
        })
        .then(data => {
            mainContainer.innerHTML = `
                <h2 class="user-info-title">Информация о пользователе</h2>
                <div id="user-courses">
                    <div class="info-row"><div class="label">Фамилия: ${data.lastname}</div></div>
                    <div class="info-row"><div class="label">Имя: ${data.firstname}</div></div>
                    <div class="info-row"><div class="label">Отчество: ${data.patronymic}</div></div>
                    <div class="info-row"><div class="label">Группа: ${data.groupp}</div></div>
                </div>
            `;
            updateUrlAndState('/profile');
        })
        .catch(err => {
            console.error('Ошибка:', err);
            if (err.message === 'not_found') {
                mainContainer.innerHTML = '<div class="info-item">Студент не найден</div>';
            } else {
                if (errorDiv) errorDiv.textContent = 'Ошибка сети или сервера';
                mainContainer.innerHTML = '<div class="error">Ошибка загрузки данных</div>';
            }
        });
};

function loadUserCourses() {
    const username = localStorage.getItem('username');
    const coursesContainer = document.getElementById('user-courses');
    if (!coursesContainer || !username) return;

    fetch('/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
    })
        .then(res => res.json())
        .then(courses => {
            if (courses.length === 0) return;

            const coursesDiv = document.createElement('div');
            coursesDiv.className = 'courses-section';
            coursesDiv.innerHTML = '<h3>Доступные курсы</h3><ul></ul>';
            const list = coursesDiv.querySelector('ul');

            courses.forEach(course => {
                const item = document.createElement('li');
                const link = document.createElement('a');
                link.textContent = course.name;
                link.id = "targetcourse";
                link.href = `?id=${course.id}&name=${encodeURIComponent(course.name)}&description=${encodeURIComponent(course.description)}&start_date=${course.start_date}&end_date=${course.end_date}`;
                item.appendChild(link);
                list.appendChild(item);
            });

            coursesContainer.appendChild(coursesDiv);
        })
        .catch(err => console.error('Ошибка загрузки курсов:', err));
}

window.loadTargetCourse = function (coursedata) {
    // Нормализуем строку параметров (может начинаться с '?' или '&')
    let paramsStr = coursedata;
    if (paramsStr.startsWith('?')) {
        paramsStr = '&' + paramsStr.substring(1);
    }
    const params = new URLSearchParams(paramsStr);
    const course = {
        id: params.get('id') || '',
        name: params.get('name') || '',
        description: params.get('description') || '',
        start_date: params.get('start_date') || '',
        end_date: params.get('end_date') || '',
    };

    const courseInfo = document.querySelector('.main-content');
    courseInfo.innerHTML = `
        <h2 id="courseTitle">Загрузка...</h2> 
        <div id="courseInfo"></div>
        <div id="contentItems" class="content-items"></div>
        <div id="error" class="error"></div>`;
    const title = document.getElementById('courseTitle');
    const contentItems = document.getElementById('contentItems');
    const errorDiv = document.getElementById('error');

    if (!course.id) {
        errorDiv.textContent = 'Курс не найден';
        return;
    }

    title.textContent = course.name;
    contentItems.innerHTML = `
        <div class="field">
            <div class="label">Общее</div>
            <div class="value">${course.description}</div>
            <div class="label">Дата начала</div>
            <div class="value">${course.start_date}</div>
            <div class="label">Дата окончания</div>
            <div class="value">${course.end_date}</div>
        </div>
    `;

    const username = localStorage.getItem('username');
    if (!username) {
        errorDiv.textContent = 'Необходимо войти в систему';
        setTimeout(() => window.location.href = '/', 2000);
        return;
    }

    // Загружаем содержимое курса
    fetch(`/course-content/${course.id}?username=${username}`)
        .then((response) => __awaiter(void 0, void 0, void 0, function* () {
            if (response.status === 403) {
                errorDiv.textContent = 'У вас нет доступа к этому курсу';
                return null;
            }
            if (!response.ok) {
                const text = yield response.text();
                throw new Error(text);
            }
            return response.json();
        })).then((items) => {
            if (!items) {
                throw new Error('Ничего не получено');
            }
            const descBlock = document.createElement('div');
            descBlock.className = 'field';
            descBlock.innerHTML = `<h3>Содержание курса</h3>`;
            contentItems.appendChild(descBlock);

            for (const item of items) {
                const div = document.createElement('div');
                div.className = 'content-item';
                if (item.type === 'text' && item.text) {
                    div.innerHTML = `<div class="text-content">${item.text.replace(/\n/g, '<br>')}</div>`;
                } else if (item.type === 'file' && item.file) {
                    div.innerHTML = `<a href="/file/${item.file.id}" download>${item.file.file_name}.${item.file.extension}</a>`;
                } else if (item.type === 'task' && item.task) {
                    div.innerHTML = `<a href="?task_id=${item.task.id}&time_id=${item.task.time_id}&name=${encodeURIComponent(item.task.name)}&qdescription=${encodeURIComponent(item.task.qdescription)}&adescription=${encodeURIComponent(item.task.adescription)}" class="task">${item.task.name}</a>`;
                } else if (item.type === 'test' && item.test) {
                    // обработка теста
                    const test = item.test;
                    div.innerHTML = `<a href="?test_id=${test.id}&title=${encodeURIComponent(test.title)}&description=${encodeURIComponent(test.description || '')}&time_limit_seconds=${test.time_limit_seconds || ''}&max_attempts=${test.max_attempts}" class="test">${test.title}</a>`;
                } else {
                    continue;
                }
                descBlock.appendChild(div);
            }

            // Обновляем URL после полной загрузки
            const newUrl = `/course?id=${course.id}&name=${encodeURIComponent(course.name)}&description=${encodeURIComponent(course.description)}&start_date=${course.start_date}&end_date=${course.end_date}`;
            updateUrlAndState(newUrl);
        })
        .catch(err => {
            console.error('Ошибка загрузки содержимого:', err);
            errorDiv.textContent = 'Не удалось загрузить содержимое курса';
        });
};

window.loadTargetTask = async function (taskData) {
    // Нормализуем строку параметров
    let paramsStr = taskData;
    if (paramsStr.startsWith('?')) {
        paramsStr = '&' + paramsStr.substring(1);
    }
    const params = new URLSearchParams(paramsStr);
    const task = {
        id: params.get('task_id') || params.get('id') || '',
        time_id: params.get('time_id') || '',
        name: params.get('name') || '',
        qdescription: params.get('qdescription') || '',
        adescription: params.get('adescription') || ''
    };

    const taskInfo = document.querySelector('.main-content');
    if (!taskInfo) return;

    taskInfo.innerHTML = `
        <h2 id="courseTitle">Загрузка...</h2>
        <div id="courseInfo"></div>
        <div id="contentItems" class="content-items"></div>
        <div id="error" class="error"></div>
    `;
    const title = document.getElementById('courseTitle');
    const contentItems = document.getElementById('contentItems');
    const errorDiv = document.getElementById('error');

    if (!task.id || !task.time_id) {
        errorDiv.textContent = 'Некорректные параметры задания';
        return;
    }

    title.textContent = task.name;

    const username = localStorage.getItem('username');
    if (!username) {
        errorDiv.textContent = 'Необходимо войти в систему';
        setTimeout(() => window.location.href = '/', 2000);
        return;
    }

    try {
        const response = await fetch(`/task/${task.id}/${task.time_id}?username=${encodeURIComponent(username)}`);
        if (response.status === 403) {
            errorDiv.textContent = 'У вас нет доступа к этому заданию';
            return;
        }
        if (!response.ok) {
            const text = await response.text();
            throw new Error(text);
        }

        const data = await response.json();
        contentItems.innerHTML = '';

        if (task.qdescription) {
            const descBlock = document.createElement('div');
            descBlock.className = 'field';
            descBlock.innerHTML = `<div class="label">Общее</div><div class="value">${task.qdescription.replace(/\n/g, '<br>')}</div>`;
            contentItems.appendChild(descBlock);
        }
        if (task.adescription) {
            const ansDescBlock = document.createElement('div');
            ansDescBlock.className = 'field';
            ansDescBlock.innerHTML = `<div class="label">Описание ответа</div><div class="value">${task.adescription.replace(/\n/g, '<br>')}</div>`;
            contentItems.appendChild(ansDescBlock);
        }

        if (data.time) {
            const timeBlock = document.createElement('div');
            timeBlock.className = 'time-info';
            timeBlock.innerHTML = `
                <h3>Время выполнения</h3>
                <div class="field"><div class="label">Начало</div><div class="value">${data.time.start_date || '—'}</div></div>
                <div class="field"><div class="label">Окончание</div><div class="value">${data.time.end_date || '—'}</div></div>
            `;
            contentItems.appendChild(timeBlock);
        }

        if (data.task_files && data.task_files.length > 0) {
            const filesBlock = document.createElement('div');
            filesBlock.className = 'task-files';
            filesBlock.innerHTML = '<h3>Файлы задания</h3><ul></ul>';
            const list = filesBlock.querySelector('ul');
            data.task_files.forEach(file => {
                const li = document.createElement('li');
                const link = document.createElement('a');
                link.href = `/file/${file.id}`;
                link.download = true;
                link.textContent = `${file.file_name}.${file.extension}`;
                li.appendChild(link);
                list.appendChild(li);
            });
            contentItems.appendChild(filesBlock);
        }
        let result_id = null;
        if (data.result) {
            result_id = data.result.id;
            const resultBlock = document.createElement('div');
            resultBlock.className = 'task-result';
            resultBlock.innerHTML = `
                <h3>Результат</h3>
                <div class="field"><div class="label">Дата ответа</div><div class="value">${data.result.create_date || '—'}</div></div>
                <div class="field"><div class="label">Статус</div><div class="value">${data.result.validation || '—'}</div></div>
                <div class="field"><div class="label">Оценка</div><div class="value">${data.result.result !== undefined ? data.result.result : '—'}</div></div>
            `;
            if (data.result.answertext && data.result.answertext.length > 0) {
                resultBlock.innerHTML += `<div class="field"><div class="label">Представленный ответ на задание: </div><div class="value">${data.result.answertext.replace(/\n/g, '<br>')}</div></div>`;
            }
            contentItems.appendChild(resultBlock);

            if (data.answer_files && data.answer_files.length > 0) {
                const answerFilesBlock = document.createElement('div');
                answerFilesBlock.className = 'answer-files';
                answerFilesBlock.innerHTML = '<h3>Файлы ответа</h3><ul></ul>';
                const list = answerFilesBlock.querySelector('ul');
                data.answer_files.forEach(file => {
                    const li = document.createElement('li');
                    const link = document.createElement('a');
                    link.href = `/file/${file.id}`;
                    link.download = true;
                    link.textContent = `${file.file_name}.${file.extension}`;
                    li.appendChild(link);
                    list.appendChild(li);
                });
                contentItems.appendChild(answerFilesBlock);
            }

            if (result_id) {
                const commentsBlock = document.createElement('div');
                commentsBlock.className = 'task-comments';
                commentsBlock.innerHTML = '<h3>Комментарии</h3><div id="commentsContainer"></div>';
                contentItems.appendChild(commentsBlock);
                const commentsContainer = commentsBlock.querySelector('#commentsContainer');
                // загружаем комментарии асинхронно, не блокируя остальной рендер
                loadComments(result_id, commentsContainer);
            }

            // Кнопка переприкрепления задания 
            const noResultBlock = document.createElement('div');
            noResultBlock.className = 'no-result';
            noResultBlock.innerHTML = `
                <p>Изменить ответ</p>
                <button id="resubmitTaskBtn" class="btn">Изменить</button>
                <div id="answerFormContainer" style="display:none;"></div>
            `;
            contentItems.appendChild(noResultBlock);
            document.getElementById('resubmitTaskBtn')?.addEventListener('click', () => {
                const container = document.getElementById('answerFormContainer');
                if (!container) return;
                if (container.style.display === 'block') {
                    container.style.display = 'none';
                    container.innerHTML = '';
                    return;
                }
                container.style.display = 'block';
                container.innerHTML = `
                    <h3>Сдать задание</h3>
                    <form id="answerForm">
                        <div class="field">
                            <label for="answerText">Ваш ответ (текст):</label>
                            <textarea id="answerText" name="answertext" rows="5" style="width:100%;"></textarea>
                        </div>
                        <div class="field">
                            <label for="answerFile">Прикрепить файл (необязательно):</label>
                            <input type="file" id="answerFile" name="file">
                        </div>
                        <button type="submit" class="btn">Отправить</button>
                        <button type="button" id="cancelAnswer" class="btn">Отмена</button>
                    </form>
                    <div id="answerStatus" class="status"></div>
                `;

                const form = document.getElementById('answerForm');
                const cancelBtn = document.getElementById('cancelAnswer');
                cancelBtn?.addEventListener('click', () => {
                    container.style.display = 'none';
                    container.innerHTML = '';
                });

                form?.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const answerText = document.getElementById('answerText').value;
                    const fileInput = document.getElementById('answerFile');
                    const file = fileInput?.files?.[0];
                    let fileId = null;

                    if (file) {
                        const formData = new FormData();
                        formData.append('file', file);
                        formData.append('username', username);
                        try {
                            const uploadRes = await fetch('/upload', { method: 'POST', body: formData });
                            if (!uploadRes.ok) throw new Error('Ошибка загрузки файла');
                            const uploadData = await uploadRes.json();
                            fileId = uploadData.file_id;
                        } catch (err) {
                            console.error(err);
                            document.getElementById('answerStatus').textContent = 'Не удалось загрузить файл';
                            return;
                        }
                    }

                    const payload = {
                        username: username,
                        answer_id: result_id,
                        task_id: Number(task.id),
                        answertext: answerText,
                        file_id: fileId !== null ? Number(fileId) : -1
                    };

                    try {
                        const response = await fetch('/set-answer', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(payload)
                        });
                        if (!response.ok) {
                            const errText = await response.text();
                            throw new Error(errText);
                        }
                        const result = await response.json();
                        if (result.success) {
                            document.getElementById('answerStatus').textContent = 'Ответ успешно сохранён!';
                            setTimeout(() => loadTargetTask(taskData), 1500);
                        } else {
                            document.getElementById('answerStatus').textContent = result.error || 'Ошибка сохранения';
                        }
                    } catch (err) {
                        console.error(err);
                        document.getElementById('answerStatus').textContent = 'Ошибка связи с сервером';
                    }
                });
            });

        } else {
            const noResultBlock = document.createElement('div');
            noResultBlock.className = 'no-result';
            noResultBlock.innerHTML = `
                <p>Задание еще не сдано.</p>
                <button id="submitTaskBtn" class="btn">Сдать задание</button>
                <div id="answerFormContainer" style="display:none;"></div>
            `;
            contentItems.appendChild(noResultBlock);

            document.getElementById('submitTaskBtn')?.addEventListener('click', () => {
                const container = document.getElementById('answerFormContainer');
                if (!container) return;
                if (container.style.display === 'block') {
                    container.style.display = 'none';
                    container.innerHTML = '';
                    return;
                }
                container.style.display = 'block';
                container.innerHTML = `
                    <h3>Сдать задание</h3>
                    <form id="answerForm">
                        <div class="field">
                            <label for="answerText">Ваш ответ (текст):</label>
                            <textarea id="answerText" name="answertext" rows="5" style="width:100%;"></textarea>
                        </div>
                        <div class="field">
                            <label for="answerFile">Прикрепить файл (необязательно):</label>
                            <input type="file" id="answerFile" name="file">
                        </div>
                        <button type="submit" class="btn">Отправить</button>
                        <button type="button" id="cancelAnswer" class="btn">Отмена</button>
                    </form>
                    <div id="answerStatus" class="status"></div>
                `;

                const form = document.getElementById('answerForm');
                const cancelBtn = document.getElementById('cancelAnswer');
                cancelBtn?.addEventListener('click', () => {
                    container.style.display = 'none';
                    container.innerHTML = '';
                });

                form?.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const answerText = document.getElementById('answerText').value;
                    const fileInput = document.getElementById('answerFile');
                    const file = fileInput?.files?.[0];
                    let fileId = null;

                    if (file) {
                        const formData = new FormData();
                        formData.append('file', file);
                        formData.append('username', username);
                        try {
                            const uploadRes = await fetch('/upload', { method: 'POST', body: formData });
                            if (!uploadRes.ok) throw new Error('Ошибка загрузки файла');
                            const uploadData = await uploadRes.json();
                            fileId = uploadData.file_id;
                        } catch (err) {
                            console.error(err);
                            document.getElementById('answerStatus').textContent = 'Не удалось загрузить файл';
                            return;
                        }
                    }

                    const payload = {
                        username: username,
                        answer_id: 0,
                        task_id: Number(task.id),
                        answertext: answerText,
                        file_id: fileId !== null ? Number(fileId) : -1
                    };

                    try {
                        const response = await fetch('/set-answer', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(payload)
                        });
                        if (!response.ok) {
                            const errText = await response.text();
                            throw new Error(errText);
                        }
                        const result = await response.json();
                        if (result.success) {
                            document.getElementById('answerStatus').textContent = 'Ответ успешно сохранён!';
                            setTimeout(() => loadTargetTask(taskData), 1500);
                        } else {
                            document.getElementById('answerStatus').textContent = result.error || 'Ошибка сохранения';
                        }
                    } catch (err) {
                        console.error(err);
                        document.getElementById('answerStatus').textContent = 'Ошибка связи с сервером';
                    }
                });
            });
        }

        // Обновляем URL
        let newUrl = `/task?task_id=${task.id}&time_id=${task.time_id}&name=${encodeURIComponent(task.name)}&qdescription=${encodeURIComponent(task.qdescription)}&adescription=${encodeURIComponent(task.adescription)}`;
        if (result_id !== null) {
            newUrl += `&answer_id=${result_id}`;
        }
        updateUrlAndState(newUrl);
    } catch (err) {
        console.error('Ошибка загрузки задания:', err);
        errorDiv.textContent = 'Не удалось загрузить данные задания';
    }
};

// Загрузка и отображение комментариев для taskresult_id
async function loadComments(taskresultId, container) {
    if (!taskresultId) return;
    try {
        const response = await fetch('/taskresult-comments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ taskresult_id: taskresultId })
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const comments = await response.json();
        if (!comments || comments.length === 0) {
            container.innerHTML = '<div class="comments-placeholder">Комментариев пока нет</div>';
            return;
        }
        let html = '<div class="comments-list"><h4>Комментарии:</h4>';
        for (const c of comments) {
            const date = new Date(c.comment_date).toLocaleString();
            // Отображаем ФИО преподавателя
            const fullName = `${c.lastname} ${c.firstname} ${c.patronymic}`.trim();
            html += `
                <div class="comment-item">
                    <strong>${escapeHtml(fullName || c.user_name)}</strong> <span class="comment-date">${date}</span>
                    <div class="comment-text">${escapeHtml(c.comment_text).replace(/\n/g, '<br>')}</div>
                </div>
            `;
        }
        html += '</div>';
        container.innerHTML = html;
    } catch (err) {
        console.error('Ошибка загрузки комментариев:', err);
        container.innerHTML = '<div class="error">Не удалось загрузить комментарии</div>';
    }
}

window.loadTargetTest = async function (testData) {
    // Нормализуем строку параметров
    let paramsStr = testData;
    if (paramsStr.startsWith('?')) {
        paramsStr = '&' + paramsStr.substring(1);
    }
    const params = new URLSearchParams(paramsStr);
    const test = {
        id: params.get('test_id') || params.get('id') || '',
        title: params.get('title') || '',
        description: params.get('description') || '',
        time_limit_seconds: params.get('time_limit_seconds') || '',
        max_attempts: params.get('max_attempts') || ''
    };

    const mainContainer = document.querySelector('.main-content');
    if (!mainContainer) return;

    mainContainer.innerHTML = `
        <h2 id="testTitle">Загрузка...</h2>
        <div id="testInfo"></div>
        <div id="testActions"></div>
        <div id="error" class="error"></div>
    `;
    const titleEl = document.getElementById('testTitle');
    const testInfo = document.getElementById('testInfo');
    const actionsDiv = document.getElementById('testActions');
    const errorDiv = document.getElementById('error');

    if (!test.id) {
        errorDiv.textContent = 'Некорректные параметры теста';
        return;
    }

    titleEl.textContent = test.title;

    // Формируем информацию о тесте
    let infoHtml = `<div class="field"><div class="label">Описание</div><div class="value">${test.description ? test.description.replace(/\n/g, '<br>') : '—'}</div></div>`;
    if (test.time_limit_seconds) {
        const minutes = Math.floor(test.time_limit_seconds / 60);
        const seconds = test.time_limit_seconds % 60;
        infoHtml += `<div class="field"><div class="label">Время на прохождение</div><div class="value">${minutes} мин ${seconds} сек</div></div>`;
    } else {
        infoHtml += `<div class="field"><div class="label">Время на прохождение</div><div class="value">Не ограничено</div></div>`;
    }
    infoHtml += `<div class="field"><div class="label">Максимум попыток</div><div class="value">${test.max_attempts || '1'}</div></div>`;
    testInfo.innerHTML = infoHtml;

    const bestResultContainer = document.createElement('div');
    bestResultContainer.id = 'bestResultContainer';
    bestResultContainer.className = 'best-result-container';
    testInfo.appendChild(bestResultContainer);

    // Загружаем лучший результат
    try {
        const username = localStorage.getItem('username');
        if (username && test.id) {
            const response = await fetch('/test/best-result', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: username,
                    test_id: parseInt(test.id, 10)
                })
            });

            if (response.ok) {
                const result = await response.json();
                const completedDate = new Date(result.completed_at).toLocaleString();
                bestResultContainer.innerHTML = `
                <div class="field best-result">
                    <div class="label">Лучший результат</div>
                    <div class="value">
                        ${result.total_points} / ${result.max_points} баллов (${result.percentage}%)<br>
                        <small>Пройдено: ${completedDate}</small>
                    </div>
                </div>
            `;
            } else if (response.status === 404) {
                bestResultContainer.innerHTML = `
                <div class="field best-result">
                    <div class="label">Лучший результат</div>
                    <div class="value">Попыток ещё не было</div>
                </div>
            `;
            } else {
                // При других ошибках просто скрываем блок
                bestResultContainer.style.display = 'none';
            }
        }
    } catch (error) {
        console.error('Ошибка при загрузке лучшего результата:', error);
        bestResultContainer.style.display = 'none';
    }

    // Кнопка начала теста (пока без логики)
    actionsDiv.innerHTML = `<button id="startTestBtn" class="btn">Начать тест</button>`;
    const startBtn = document.getElementById('startTestBtn');
    if (startBtn) {
        startBtn.addEventListener('click', () => {
            //console.log(test.id);
            startTestAttempt(test.id, test.title);
        });
    }

    // Обновляем URL
    const newUrl = `/test?test_id=${test.id}&title=${encodeURIComponent(test.title)}&description=${encodeURIComponent(test.description)}&time_limit_seconds=${test.time_limit_seconds}&max_attempts=${test.max_attempts}`;
    updateUrlAndState(newUrl);
};

async function startTestAttempt(testId, testTitle) {
    const username = localStorage.getItem('username');
    if (!username) {
        alert('Необходимо войти в систему');
        window.location.href = '/';
        return;
    }

    try {
        const response = await fetch(`/test/${testId}/questions?username=${encodeURIComponent(username)}`);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText);
        }
        const data = await response.json();
        // Ожидаемый ответ: { attempt_id, questions, end_time }
        const attemptId = data.attempt_id;
        const questions = data.questions;
        const endTimeStr = data.end_time;
        //console.log(testId);
        renderTestPage(testTitle, testId, questions, attemptId, endTimeStr);
    } catch (err) {
        console.error('Ошибка начала теста:', err);
        alert('Не удалось начать тест: ' + err.message);
    }
}

function renderTestPage(title, test_id, questions, attemptId, endTimeStr) {
    const mainContainer = document.querySelector('.main-content');
    if (!mainContainer) return;

    mainContainer.innerHTML = `
        <h2>${escapeHtml(title)}</h2>
        <div id="testTimer" class="timer" style="font-weight:bold; margin-bottom:20px;"></div>
        <form id="testForm">
            <div id="questionsContainer"></div>
            <button type="button" id="submitTestBtn" class="btn">Завершить тест</button>
        </form>
        <div id="testError" class="error"></div>
    `;

    const questionsContainer = document.getElementById('questionsContainer');
    if (!questionsContainer) return;

    questions.forEach((q, idx) => {
        const qDiv = document.createElement('div');
        qDiv.className = 'question';
        qDiv.style.marginBottom = '20px';
        qDiv.style.padding = '10px';
        qDiv.style.border = '1px solid #ccc';
        qDiv.style.borderRadius = '5px';

        qDiv.innerHTML = `<p><strong>${idx + 1}. ${escapeHtml(q.question_text)}</strong> (${q.points} баллов)</p>`;

        // Контейнер для вариантов ответов
        const optionsContainer = document.createElement('div');
        optionsContainer.className = 'question-options';
        optionsContainer.style.marginLeft = '20px';

        if (q.question_type === 'single_choice') {
            // Радиокнопки
            if (q.options && q.options.length > 0) {
                q.options.forEach(opt => {
                    const label = document.createElement('label');
                    label.style.display = 'block';
                    label.style.margin = '5px 0';
                    const radio = document.createElement('input');
                    radio.type = 'radio';
                    radio.name = `question_${q.id}`;
                    radio.value = opt.sort_order;
                    label.appendChild(radio);
                    label.appendChild(document.createTextNode(' ' + escapeHtml(opt.option_text)));
                    optionsContainer.appendChild(label);
                });
            } else {
                optionsContainer.innerHTML = '<p class="info">Нет вариантов ответа</p>';
            }
        }
        else if (q.question_type === 'multiple_choice') {
            // Чекбоксы
            if (q.options && q.options.length > 0) {
                q.options.forEach(opt => {
                    const label = document.createElement('label');
                    label.style.display = 'block';
                    label.style.margin = '5px 0';
                    const checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkbox.name = `question_${q.id}[]`;
                    checkbox.value = opt.sort_order;
                    label.appendChild(checkbox);
                    label.appendChild(document.createTextNode(' ' + escapeHtml(opt.option_text)));
                    optionsContainer.appendChild(label);
                });
            } else {
                optionsContainer.innerHTML = '<p class="info">Нет вариантов ответа</p>';
            }
        }
        else if (q.question_type === 'text') {
            const textarea = document.createElement('textarea');
            textarea.name = `question_${q.id}`;
            textarea.rows = 3;
            textarea.style.width = '100%';
            optionsContainer.appendChild(textarea);
        }
        else {
            optionsContainer.innerHTML = '<p class="error">Неизвестный тип вопроса</p>';
        }

        qDiv.appendChild(optionsContainer);
        questionsContainer.appendChild(qDiv);
    });

    // Таймер
    if (endTimeStr) {
        const endTime = new Date(endTimeStr).getTime();
        startTimer(endTime);
    } else {
        const timerDiv = document.getElementById('testTimer');
        if (timerDiv) timerDiv.textContent = 'Время не ограничено';
    }

    // Кнопка завершения теста (сбор ответов)
    const submitBtn = document.getElementById('submitTestBtn');
    if (submitBtn) {
        submitBtn.addEventListener('click', () => {
            finishTest(test_id, attemptId, questions);
        });
    }
    //console.log(test_id);
    // Обновляем URL (опционально)
    const newUrl = `/test-run?test_id=${test_id}&attempt_id=${attemptId}`;
    updateUrlAndState(newUrl);
}

async function finishTest(testId, attemptId, questions) {
    const answers = [];

    for (const q of questions) {
        const questionId = q.id;
        let answer = null;

        if (q.question_type === 'single_choice') {
            const selectedRadio = document.querySelector(`input[name="question_${questionId}"]:checked`);
            answer = selectedRadio ? parseInt(selectedRadio.value, 10) : null;
        }
        else if (q.question_type === 'multiple_choice') {
            const checkboxes = document.querySelectorAll(`input[name="question_${questionId}[]"]:checked`);
            answer = Array.from(checkboxes).map(cb => parseInt(cb.value, 10));
        }
        else if (q.question_type === 'text') {
            const textarea = document.querySelector(`textarea[name="question_${questionId}"]`);
            answer = textarea ? textarea.value.trim() : '';
        }

        answers.push({
            question_id: questionId,
            answer: answer
        });
    }
    try {
        const response = await fetch('/test/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                test_id: 1,
                attempt_id: attemptId,
                answers: answers
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText);
        }

        const result = await response.json();
        alert(`Тест завершён! Результат: ${result.score}/${result.max_score}`);

        // Возврат на страницу курса или к списку тестов
        if (confirm('Вернуться к курсу?')) {
            window.history.back();
        } else {
            loadCourses();
        }
    } catch (err) {
        console.error('Ошибка при отправке теста:', err);
        document.getElementById('testError').textContent = 'Ошибка сохранения ответов: ' + err.message;
    }
}

function startTimer(endTimestamp) {
    const timerElement = document.getElementById('testTimer');
    if (!timerElement) return;

    const interval = setInterval(() => {
        const now = Date.now();
        const remaining = endTimestamp - now;
        if (remaining <= 0) {
            clearInterval(interval);
            timerElement.textContent = 'Время вышло!';
            // Автоматически завершить тест
            if (confirm('Время вышло. Завершить тест?')) {
                document.getElementById('submitTestBtn')?.click();
            }
        } else {
            const minutes = Math.floor(remaining / 60000);
            const seconds = Math.floor((remaining % 60000) / 1000);
            timerElement.textContent = `Осталось времени: ${minutes} мин ${seconds} сек`;
        }
    }, 1000);
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function (m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// === КАЛЕНДАРЬ (не зависит от маршрутов) ===
window.calendarState = { currentDate: new Date() };

window.updateCalendar = function (targetDate = null) {
    const calendarMonth = document.querySelector('.calendar-month');
    const calendarGrid = document.querySelector('.calendar-grid');
    if (!calendarMonth || !calendarGrid) return;

    const displayDate = targetDate ? new Date(targetDate) : window.calendarState.currentDate;
    window.calendarState.currentDate = displayDate;

    const months = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
        'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
    const dayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

    calendarMonth.textContent = `${months[displayDate.getMonth()]} ${displayDate.getFullYear()}`;
    calendarGrid.innerHTML = '';

    dayNames.forEach(day => {
        const header = document.createElement('div');
        header.className = 'calendar-day-header';
        header.textContent = day;
        calendarGrid.appendChild(header);
    });

    const firstDay = new Date(displayDate.getFullYear(), displayDate.getMonth(), 1).getDay();
    const daysInMonth = new Date(displayDate.getFullYear(), displayDate.getMonth() + 1, 0).getDate();
    const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1;

    for (let i = 0; i < adjustedFirstDay; i++) {
        const empty = document.createElement('div');
        empty.className = 'calendar-day other-month';
        calendarGrid.appendChild(empty);
    }

    const today = new Date();
    const isCurrentMonth = displayDate.getMonth() === today.getMonth() &&
        displayDate.getFullYear() === today.getFullYear();

    for (let day = 1; day <= daysInMonth; day++) {
        const dayEl = document.createElement('div');
        dayEl.className = 'calendar-day' + (isCurrentMonth && day === today.getDate() ? ' today' : '');
        dayEl.textContent = day;
        dayEl.dataset.date = `${displayDate.getFullYear()}-${String(displayDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        calendarGrid.appendChild(dayEl);
    }
};

// === ИНИЦИАЛИЗАЦИЯ ===
document.addEventListener('DOMContentLoaded', () => {
    // Восстанавливаем состояние по текущему URL
    restoreStateFromURL();

    // Календарь
    window.updateCalendar();
    document.querySelectorAll('.calendar-nav').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const direction = e.target.textContent.trim();
            const current = window.calendarState.currentDate;
            const newDate = new Date(current);
            if (direction === '←') newDate.setMonth(newDate.getMonth() - 1);
            else if (direction === '→') newDate.setMonth(newDate.getMonth() + 1);
            window.updateCalendar(newDate);
        });
    });

    // Приветствие
    const username = localStorage.getItem('username');
const helloUser = document.querySelector('.helloUser');

if (username && helloUser) {
    // 1. Сразу показываем логин, чтобы пользователь не видел пустое место
    helloUser.textContent = `Здравствуйте, ${username}!`;

    // 2. Асинхронно подгружаем ФИО с сервера
    fetch('/user-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
    })
    .then(res => res.ok ? res.json() : null)
    .then(data => {
        if (data) {
            // Собираем ФИО, игнорируя пустые/отсутствующие поля
            const fio = [data.lastname, data.firstname, data.patronymic]
                        .filter(part => part && part.trim() !== '')
                        .join(' ');
            
            if (fio) {
                helloUser.textContent = `Здравствуйте, ${fio}!`;
            }
        }
    })
    .catch(err => console.warn('Не удалось загрузить ФИО для приветствия:', err));
}

    // Обработчик кнопки "Личный кабинет"
    const cabinetLink = document.querySelector('.cabinet-link');
    if (cabinetLink) {
        cabinetLink.addEventListener('click', (e) => {
            e.preventDefault();
            loadUserInfo();
        });
    }

    // Обработчик кликов по курсам
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('targetcourse')) {
            e.preventDefault();
            const url = new URL(e.target.href);
            loadTargetCourse(url.search);
        }
    });

    // Обработчик кликов по заданиям
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('task')) {
            e.preventDefault();
            const url = new URL(e.target.href);
            loadTargetTask(url.search);
        }
        if (e.target.classList.contains('test')) {
            e.preventDefault();
            const url = new URL(e.target.href);
            loadTargetTest(url.search);
        }
    });

    // Обработчик навигации назад/вперёд
    window.addEventListener('popstate', () => {
        restoreStateFromURL();
    });
});