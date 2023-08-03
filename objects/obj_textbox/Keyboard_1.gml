if (!selected)
  exit;
	
if ((string_length(text) == maxChars && !keyboard_check(vk_backspace))
  || (string_width(text) == maxWidth && !keyboard_check(vk_backspace)))
{
	keyboard_string = text;
  exit;
}

text = keyboard_string;
valid = isValid();