/// @description Insert description here

if keyboard_check(vk_backspace) and selected == true and alarm_get(delete_timer) <= 0 and 
!keyboard_check_pressed(vk_backspace) and alarm_get(delete_timer) <= 0 {
	text = string_delete(text, string_length(text), 1);
	alarm_set(delete_timer, 5);
	keyboard_string = "";
}	

if keyboard_check_pressed(vk_backspace) and selected == true and alarm_get(delete_timer) <= 0 {
	text = string_delete(text, string_length(text), 1);
	alarm_set(delete_timer, 4);
	keyboard_string = "";
}

if keyboard_check(vk_anykey) and selected == true and string_length(text) < char_max {
	text = text + string(keyboard_string);
	keyboard_string = "";
}
else exit;