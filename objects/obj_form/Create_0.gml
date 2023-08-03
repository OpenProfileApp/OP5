y = 200;
x = room_width/2;
inputs = ds_list_create();
focus = 0;

var inst = instance_create_layer(x, y, "Instances", new_text, {
	formId: id,
	label: "Name",
	private: false,
	maxChars: 25,
	tabOrder: 1,
	validationMessage: "Name is required",
	isValid: function() {
		return string_length(text) > 0
	}
});
ds_list_add(inputs, inst);

validate = function() {
	var formValid = true;
	
	for (var i = 0; i < ds_list_size(inputs); i++)
		with (ds_list_find_value(inputs, i))
		{
			valid = isValid();
			if (!valid)
			  formValid = false;
		}
		
	if (formValid)
		success();
}

success = function() {
	var str = "";
	for (var i = 0; i < ds_list_size(inputs); i++)
	  str += ds_list_find_value(inputs, i).text + "\n";
	
	show_message(str);
	
	var _saveData = array_create(0);
with (obj_form)
{
	var savetext =
	{
		name0 : object_get_name(object_index)	
	}
	array_push(_saveData, savetext);
}

var _string = json_stringify(_saveData);
var _buffer = buffer_create(string_byte_length(_string) +1, buffer_fixed, 1);
buffer_write(_buffer, buffer_string, _string);
buffer_save(_buffer, "save.txt")
buffer_delete(_buffer);
}