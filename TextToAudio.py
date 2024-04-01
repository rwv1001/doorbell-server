from gtts import gTTS
import sys

language = 'en'
outputText = sys.argv[1]
outputFile = sys.argv[2]
output = gTTS(text=outputText, lang=language, slow=False)
output.save(outputFile)
