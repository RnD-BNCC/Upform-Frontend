const inputBox = document.getElementById("input-box");
const listContainer = document.getElementById("list-container");
const completedCounter = document.getElementById("completed-counter");
const uncompletedCounter = document.getElementById("uncompleted-counter");

function addTask() {
  const task = inputBox.value.trim();

  if (!task) {
    alert("Please write down a task");
    return;
  }

  const li = document.createElement("li");

  li.innerHTML = `
    <label>
      <input type="checkbox">
      <span>${task}</span>
    </label>
      <span class="edit-btn">Edit</span>
      <span class="delete-btn">Delete</span>
  `;

  const checkbox = li.querySelector("input");
  const editBtn = li.querySelector(".edit-btn");
  const taskSpan = li.querySelector("label span");
  const deleteBtn = li.querySelector(".delete-btn");

  // ✅ Checkbox
  checkbox.addEventListener("click", function () {
    li.classList.toggle("completed", checkbox.checked);
    updateCounters();
  });

  // ✅ Edit
  editBtn.addEventListener("click", function () {
    const update = prompt("Edit task:", taskSpan.textContent);
    if (update !== null && update.trim() !== "") {
      taskSpan.textContent = update.trim();
      li.classList.remove("completed");
      checkbox.checked = false;
      updateCounters();
    }
  });

  // ✅ Delete
  deleteBtn.addEventListener("click", function () {
    if (confirm("Are you sure you want to delete this task?")) {
      li.remove();
      updateCounters();
    }
  });

  listContainer.appendChild(li);
  inputBox.value = "";

  updateCounters();
}

function updateCounters() {
  const completedTasks = document.querySelectorAll(".completed").length;
  const totalTasks = document.querySelectorAll("#list-container li").length;

  completedCounter.textContent = completedTasks;
  uncompletedCounter.textContent = totalTasks - completedTasks;
}