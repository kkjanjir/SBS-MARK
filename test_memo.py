import re

with open('app/page.tsx', 'r') as f:
    content = f.read()

# Check for React.memo
if 'React.memo' in content:
    print("React.memo already exists")
