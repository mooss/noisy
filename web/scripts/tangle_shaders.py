import re
from pathlib import Path

"""Construct a map from code block name to its content.
"""
def extract_code_blocks(org_file_path):
    content = Path(org_file_path).read_text()

    # Code block name is captured in group 1, content is captured in group 2.
    pattern = re.compile(
        r"#\+name:\s*(\w+).*?#\+begin_src.*?\n(.*?)\n#\+end_src",
        re.DOTALL,
    )

    return {name: code for name, code in pattern.findall(content)}

SOURCE='src/shaders/literate.org'
DEST='src/shaders/strings.ts'

mapping = '\n'.join(f'    {name}: {repr(code)},' for name, code in extract_code_blocks(SOURCE).items())
content = f'''export const shaders = {{
{mapping}
}};
'''

with open(DEST, 'w') as out:
    out.write(content)
