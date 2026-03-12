# 🧩 Divide & Conquer Algorithm Visualizer

An interactive web-based tool that **visualizes Divide and Conquer algorithms** step-by-step with time complexity analysis — built with pure HTML, CSS, and JavaScript.

![Divide & Conquer](https://img.shields.io/badge/Algorithms-Divide%20%26%20Conquer-6c63ff?style=for-the-badge)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)

---

## ✨ Features

- **Step-by-step visualization** of each algorithm with play, step, and reset controls
- **Phase-labeled steps** — every action is tagged as **Divide**, **Conquer**, or **Combine**
- **Time complexity analysis** with recurrence relations and Master Theorem breakdowns
- **Adjustable animation speed** (1x – 10x)
- **Custom & random input** support for every algorithm
- **Dark-themed**, responsive, single-page UI — no dependencies, no build step

---

## 📚 Algorithms Included

| # | Algorithm | Time Complexity | Recurrence |
|---|-----------|----------------|------------|
| 1 | **Merge Sort** | O(n log n) | T(n) = 2T(n/2) + O(n) |
| 2 | **Quick Sort** | O(n log n) avg, O(n²) worst | T(n) = T(k) + T(n−k−1) + O(n) |
| 3 | **Min & Max Finding** | O(n) | T(n) = 2T(n/2) + 2 |
| 4 | **Maximum Subarray Sum** | O(n log n) | T(n) = 2T(n/2) + O(n) |
| 5 | **Strassen's Matrix Multiplication** | O(n^2.807) | T(n) = 7T(n/2) + O(n²) |
| 6 | **Closest Pair of Points** | O(n log n) | T(n) = 2T(n/2) + O(n) |
| 7 | **Convex Hull (D&C)** | O(n log n) | T(n) = 2T(n/2) + O(n) |

---

## 🚀 Getting Started

No installation needed — just open the HTML file in a browser.

```bash
# Clone the repo
git clone https://github.com/AaravPilania/divide-and-conquer-visualizer.git

# Open in browser
start index.html        # Windows
open index.html         # macOS
xdg-open index.html     # Linux
```

Or simply **double-click** `index.html`.

---

## 🖥️ How It Works

Each algorithm follows the **Divide and Conquer** paradigm:

```
┌─────────────────────────────────────┐
│            ORIGINAL PROBLEM         │
└──────────────┬──────────────────────┘
               │  DIVIDE
       ┌───────┴───────┐
       ▼               ▼
 ┌───────────┐   ┌───────────┐
 │ Subproblem│   │ Subproblem│
 │   (Left)  │   │  (Right)  │
 └─────┬─────┘   └─────┬─────┘
       │  CONQUER       │  CONQUER
       ▼               ▼
 ┌───────────┐   ┌───────────┐
 │  Solution │   │  Solution │
 │   (Left)  │   │  (Right)  │
 └─────┬─────┘   └─────┬─────┘
       │               │
       └───────┬───────┘
               │  COMBINE
               ▼
      ┌─────────────────┐
      │  FINAL SOLUTION │
      └─────────────────┘
```

### Interface Overview

| Section | Description |
|---------|-------------|
| **Top bar** | Algorithm tabs — click to switch |
| **Controls** | Input field, Random, Start, Step, Reset, Speed slider |
| **Step indicator** | Current phase badge + step description + counter |
| **Visualization area** | Animated view of the algorithm in action |
| **Sidebar** | Algorithm description, D&C steps, recurrence, complexity table |

---

## 🎨 Color Legend

| Color | Meaning |
|-------|---------|
| 🟡 Yellow | **Divide** phase |
| 🟢 Green | **Conquer** phase |
| 🟣 Purple | **Combine** phase |
| 🔵 Blue | Left partition / Min element |
| 🔴 Red | Max element |
| 🩷 Pink | Pivot (Quick Sort) |
| 🩵 Cyan | Right partition |
| ✅ Teal | Merged / Final result |

---

## 📁 Project Structure

```
divide-and-conquer-visualizer/
└── index.html    ← Single self-contained file (HTML + CSS + JS)
```

Zero dependencies. No build tools. Pure web standards.

---

## 🧠 Complexity Analysis

Each algorithm's sidebar shows:
- **Recurrence relation** — expresses the runtime recursively
- **Master Theorem application** — which case applies and why
- **Best / Average / Worst case** complexity
- **Space complexity**

---

## 📜 License

This project is open source and available under the [MIT License](LICENSE).
