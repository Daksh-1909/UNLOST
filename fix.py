import docx
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls

doc = docx.Document(r'C:\Users\DAKSH\OneDrive\Desktop\demo\UNLOST_Research_Paper new (1).docx')

# Paragraph 15 is the last line of the 4th author's block
p = doc.paragraphs[15]

sectPr_xml = """
<w:sectPr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
    <w:type w:val="continuous"/>
    <w:cols w:num="4" w:space="708"/>
</w:sectPr>
"""
sectPr = parse_xml(sectPr_xml)
p._p.get_or_add_pPr().append(sectPr)

try:
    doc.save(r'C:\Users\DAKSH\OneDrive\Desktop\demo\UNLOST_Research_Paper new (1).docx')
    print("Successfully fixed section breaks.")
except PermissionError:
    print("Permission denied - file is open.")
