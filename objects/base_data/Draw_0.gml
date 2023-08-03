// DRAW BOX INFO 
draw_self();
draw_set_color(c_white);
draw_set_halign(fa_left);
draw_set_valign(fa_center);
draw_set_font(open_sans);
draw_text(x - 250, y - 50, box_id);

// DRAW BOX TEXT
draw_self();
draw_set_color(c_white);
draw_set_halign(fa_left);
draw_set_valign(fa_center);
draw_set_font(open_sans);

if selected == true {
	///var _draw_text = string_repeat("*", string_length(text));
	draw_text(x - 250, y, text + "|");
}
else draw_text(x - 250, y, text);

if (position_meeting(mouse_x, mouse_y, self)) {
	draw_text(mouse_x, mouse_y, help);
}