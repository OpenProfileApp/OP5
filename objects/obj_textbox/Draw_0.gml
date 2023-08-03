draw_self();

draw_set_halign(fa_left);
draw_set_valign(fa_middle);
draw_set_color(c_white);
draw_text(x - sprite_width/2, y - 50, label + ":");

var blinkChar = selected && blink ? "|" : "";
var drawText = private ? string_repeat("*", string_length(text)) : text;
draw_text(x - sprite_width/2 + 25, y, drawText + blinkChar);

if (!valid)
{
	draw_set_halign(fa_center);
	draw_set_color(c_red);
	
	var msg = validationMessage != undefined ? validationMessage: label + " is required"
	draw_text(x, y + 40, msg);
}