text = "";
maxWidth = sprite_width - 50;
maxChars = maxChars ?? 10;
blink = false;
blinkSpeed = 0.5;
alarm[0] = room_speed *blinkSpeed;
selected = false;
valid = true;

select = function() {
	selected = true;
  keyboard_string = text;
  formId.focus = tabOrder;
}