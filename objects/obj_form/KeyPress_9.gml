focus = focus < ds_list_size(inputs) ? focus + 1 : 1;

for (var i = 0; i < ds_list_size(inputs); i++)
{
	var input = ds_list_find_value(inputs, i);
	input.selected = false;
	
	if (input.tabOrder == focus)
		input.select()
}