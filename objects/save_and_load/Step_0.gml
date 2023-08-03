// SAVE DATA
if keyboard_check(vk_control) and keyboard_check_pressed(ord("S")) {
	var _saveData = array_create(0);
	var file;
	var savetext =
		{
			text1 : t1.text,
			text2 : t2.text,
			text3 : t3.text,
			text4 : t4.text,
			text5 : t5.text,
			text6 : t6.text,
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
			t1.text = _loadText.text1;
			t2.text = _loadText.text2;
			t3.text = _loadText.text3;
			t4.text = _loadText.text4;
			t5.text = _loadText.text5;
			t6.text = _loadText.text6;
			
			show_debug_message("Loaded!");
		}
	}
}	