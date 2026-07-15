import re

with open('app/page.tsx', 'r') as f:
    content = f.read()

# Verify that there are functions to extract
if "const getDynamicSubjects =" in content and "const getGrade =" in content:
    print("Found helper functions.")
