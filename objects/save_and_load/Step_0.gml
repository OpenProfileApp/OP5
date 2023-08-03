// SAVE DATA
if keyboard_check(vk_control) and keyboard_check_pressed(ord("S")) {
	var _saveData = array_create(0);
	var file;
	var savetext =
		{
			text1 : box_1.text,
			text2 : box_2.text,
			text3 : box_3.text,
			text4 : box_4.text,
			text5 : box_5.text,
			text6 : box_6.text,
		}
		array_push(_saveData, savetext);
	
	var _string = json_stringify(_saveData);
	var _buffer = buffer_create(string_byte_length(_string) +1, buffer_fixed, 1);
	buffer_write(_buffer, buffer_string, _string);

	file = get_save_filename("OpenProfle 5 File (.op5)|*.op5", "");
	if file != ""
	{
	    buffer_save(_buffer, file);
	}

	buffer_delete(_buffer);

	show_debug_message("Saved!")
}

// LOAD DATA
if keyboard_check(vk_control) and keyboard_check_pressed(ord("O")) {
	file = get_open_filename("OpenProfle 5 File (.op5)|*.op5", "");
	if file != ""
	{
		var _buffer = buffer_load(file);
		var _string = buffer_read (_buffer, buffer_string);
		buffer_delete(_buffer);
		var _loadData = json_parse(_string);
		while array_length(_loadData) > 0
		{
			var _loadText = array_pop(_loadData);
			box_1.text = _loadText.text1;
			box_2.text = _loadText.text2;
			box_3.text = _loadText.text3;
			box_4.text = _loadText.text4;
			box_5.text = _loadText.text5;
			box_6.text = _loadText.text6;
			
			show_debug_message("Loaded!");
		}
	}
}	