with (obj_form)
var _saveData = array_create(0);
var file;
var savetext =
	{
		fullname : data.fullname,
		age : data.age,
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