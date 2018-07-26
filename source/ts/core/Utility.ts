import * as path from 'path';

export class Utility
{
	public static removeExtension(fullpath : string)
	{
		let extension = path.extname(fullpath);
		return fullpath.substr(0, fullpath.length - extension.length);
	}
}
