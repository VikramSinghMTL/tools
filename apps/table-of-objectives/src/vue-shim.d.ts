// Lets plain JavaScript files import .vue components when type-checking.
declare module "*.vue" {
	import type { DefineComponent } from "vue";

	const component: DefineComponent;
	export default component;
}
