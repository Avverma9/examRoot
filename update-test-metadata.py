import json
from pathlib import Path

path = Path('test.json')
text = path.read_text(encoding='utf-8')

# Parse the JSON file; if it has any malformed entries, this will raise a helpful error.
data = json.loads(text)

count = 0

def walk(node):
    global count
    if isinstance(node, list):
        for item in node:
            walk(item)
        return
    if not isinstance(node, dict):
        return
    if 'questions' in node and isinstance(node['questions'], list):
        q_count = len(node['questions'])
        node['totalQuestions'] = q_count
        node['duration'] = max(1, (q_count + 1) // 2) if q_count else 0
        count += 1
    for value in node.values():
        walk(value)

walk(data)
path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(f'Updated {count} test entries.')
