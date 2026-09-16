from pathlib import Path
p = Path('src/App.jsx')
s = p.read_text(encoding='utf-8')
old = 'const startPomForEntry = (entry) => { timerActions.link("plan:" + entry.id); timerActions.setMode("pomodoro"); openApp("timer"); };'
new = 'const startPomForEntry = (entry) => { timerActions.setMode("pomodoro"); timerActions.link("plan:" + entry.id); openApp("timer"); };'
if old in s:
    p.write_text(s.replace(old, new, 1), encoding='utf-8')
    print('Planner Pomodoro ordering fixed')
else:
    print('Planner Pomodoro ordering already fixed')
