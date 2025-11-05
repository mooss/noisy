import re
from pathlib import Path
from itertools import groupby

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

def shader_name(block_name):
    return block_name.split('_', 3)[0]
def shader_type(block_name):
    return block_name.split('_', 3)[1]
def shader_role(block_name):
    return block_name.split('_', 3)[2]

cb_specs = extract_code_blocks(SOURCE)

# Transform a dict into a JavaScript Object.
def jsify(indent, dico):
    outside = '    ' * indent
    inside = '    ' + outside
    lines = (f'{inside}{key}: {value},' for key, value in dico.items())
    return '{\n' +\
        '\n'.join(lines) + '\n'+ outside + '}'

# Create a nested mapping like the following:
# {palette: vs: decl: 'shader implementation'} (for the block name palette_vs_decl).
mapping_spec = jsify(0, {
    name: jsify(1, {
        typ: jsify(2, {
            role: repr(cb_specs[next(roleids)])
            for role, roleids in groupby(typids, shader_role)
        })
        for typ, typids in groupby(nameids, shader_type)
    }) for name, nameids in groupby(cb_specs.keys(), shader_name)
})

print(mapping_spec)

content = f'''// This file contains shader implementations extracted from //web/{SOURCE}, modifications must therefore be made there.
// See //web/Makefile to regenerate this file.

export const shaders = {mapping_spec};
'''

with open(DEST, 'w') as out:
    out.write(content)
