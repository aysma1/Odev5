document.addEventListener('DOMContentLoaded', () => {
    refreshTodoList();
});

document.getElementById('addButton').addEventListener('click', () => {
    const taskInput = document.getElementById('taskinput');
    const task = taskInput.value.trim();
    
    if (task === '') {
        alert('Task cannot be empty!');
        return;
    }

    fetch('/add-task', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ task: task })
    })
    .then(response => response.json())
    .then(data => {
        console.log('Task added:', data);
        refreshTodoList();
        taskInput.value = '';
    })
    .catch(error => console.error('Error:', error));
});

function refreshTodoList() {
    fetch('/read')
    .then(response => response.json())
    .then(data => {
        const todoList = document.querySelector('#taskList');
        todoList.innerHTML = '';

        if(data.length === 0){
            document.querySelector('.list').classList.add('empty');
        }else{
            document.querySelector('.list').classList.remove('empty');
        }



        data.forEach(item => {
            const div = document.createElement('div');
            div.className = 'items';
            div.id = `task-${item.id}`;

            const checkbox = document.createElement('input');
            checkbox.className = 'checkbox';
            checkbox.type = 'checkbox';

            const text = document.createElement('span');
            text.className = 'task-text';
            text.textContent = item.task;

            const editButton = document.createElement('button');
            editButton.innerHTML = '<i class="fas fa-edit"></i>';

            const deleteButton = document.createElement('button');
            deleteButton.innerHTML = '<i class="fas fa-trash-alt"></i>';

            editButton.addEventListener('click', () => {
                
                div.removeChild(checkbox);
                div.removeChild(text);
                div.removeChild(deleteButton);
                div.removeChild(editButton);

                const existingEditDiv = document.querySelector(`#edit-${item.id}`);
                if (existingEditDiv) {
                    existingEditDiv.remove();
                    return;
                }
                const editDiv = document.createElement('div');
                editDiv.className = 'edit';
                editDiv.id = `edit-${item.id}`;

                const editInput = document.createElement('input');
                editInput.type = 'text';
                editInput.value = item.task;

                const saveButton = document.createElement('button');
                saveButton.textContent = 'Save';

                saveButton.addEventListener('click', () => {
                    const updatedTask = editInput.value.trim();
                    if(updatedTask == ''){
                        alert('Task cannot be empty');
                        return;
                    }
                    fetch(`update-task/${item.id}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({task: updatedTask})
                    })
                    .then(response => response.json())
                    .then(data => {
                        console.log('Task updated:', data);
                        text.textContent = updatedTask;
                        editDiv.remove();
                        div.appendChild(checkbox);
                        div.appendChild(text);
                        div.appendChild(editButton);
                        div.appendChild(deleteButton);
                    })
                    .catch(error => console.error('Error:', error));
                });

                editDiv.appendChild(editInput);
                editDiv.appendChild(saveButton);
                div.appendChild(editDiv);
            });


            deleteButton.addEventListener('click', () => {
                console.log(`Deleting task with ID: ${item.id}`);

                fetch(`/delete-task/${item.id}`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                })
                .then(response => {
                    console.log('Task deleted', data);
                    refreshTodoList();
                })
                .catch(error => console.error('Error:', error));
            });

            div.appendChild(checkbox);
            div.appendChild(text);
            div.appendChild(editButton);
            div.appendChild(deleteButton);
            todoList.appendChild(div);
        });
    })
    .catch(error => console.error('Error:', error));
}
