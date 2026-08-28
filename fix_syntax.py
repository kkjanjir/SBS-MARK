import re

with open('app/page.tsx', 'r') as f:
    content = f.read()

# Replace the incorrect end of MarksheetApp
bad_end = """      <div id="print-bulk-container" className="print-area">
        {bulkPrintMarksheets}
      </div>
    </>
  )
});"""

good_end = """      <div id="print-bulk-container" className="print-area">
        {bulkPrintMarksheets}
      </div>
    </>
  )
}"""

content = content.replace(bad_end, good_end)

with open('app/page.tsx', 'w') as f:
    f.write(content)
