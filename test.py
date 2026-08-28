import re

with open('app/page.tsx', 'r') as f:
    content = f.read()

print("import { useState, useEffect, useCallback, useMemo, memo } from 'react': " + str(content.find("import { useState, useEffect } from 'react';")))
