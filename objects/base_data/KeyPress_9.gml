/// @description Insert description here

if selected == true {
	var get = object_get_name(object_index);
	
		if get == "box_1" and alarm_get(select_timer) <= 0 {
		alarm_set(select_timer, 10);
		box_1.selected = false;
		keyboard_string = "";
		box_2.selected = true;
		keyboard_string = "";
	}
	
	if get == "box_2" and alarm_get(select_timer) <= 0 {
		alarm_set(select_timer, 10);
		box_2.selected = false;
		keyboard_string = "";
		box_3.selected = true;
		keyboard_string = "";
	}
	
	if get == "box_3" and alarm_get(select_timer) <= 0 {
		alarm_set(select_timer, 5);
		box_3.selected = false;
		keyboard_string = "";
		box_4.selected = true;
		keyboard_string = "";
	}
}