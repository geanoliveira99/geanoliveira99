with open('src/components/ui/MiniGame.tsx', 'rb') as f:
    data = f.read()

# The corrupted span with broken bytes for the midGameTip toast
# We search for the surrounding unique context to be safe
old = (
    b'border:\'1px solid rgba(180,100,255,0.5)\', borderRadius:9, padding:\'6px 10px\', boxShadow:\'0 0 14px rgba(150,60,255,0.25)\' }}>\n'
    b'                  <span style={{ fontSize:16, flexShrink:0 }}>'
)
new = (
    b'border:\'1px solid rgba(180,100,255,0.5)\', borderRadius:9, padding:\'6px 10px\', boxShadow:\'0 0 14px rgba(150,60,255,0.25)\' }}>\n'
    b'                  <img src="/GAME/airplane.svg" alt="astronauta" style={{ width:20, height:20, flexShrink:0, filter:\'drop-shadow(0 0 4px #bb66ff)\' }} />'
    b'\n                  <span style={{ display:\'none\' }}>'
)

if old in data:
    print('Pattern found, replacing...')
    data = data.replace(old, new)
    # now remove everything between the hidden span tags (the corrupted bytes + closing span)
else:
    print('Pattern not found, trying broader search...')
    # Find by unique text nearby
    idx = data.find(b'border:\'1px solid rgba(180,100,255,0.5)\'')
    if idx == -1:
        print('Not found at all!')
    else:
        # Print 300 bytes after to inspect
        snippet = data[idx:idx+300]
        print('Found at', idx)
        print(repr(snippet))

with open('src/components/ui/MiniGame.tsx', 'wb') as f:
    f.write(data)
print('done')
