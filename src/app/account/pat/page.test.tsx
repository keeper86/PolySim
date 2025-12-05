
import { describe, it } from "node:test";
import PatPage from "./page";

describe('PatPage', ()=>{
    it('renders headers, components for tokens: name field, expiry dropdown, Generate Token button');
    it('renders all the components of an existing token: token Name, Created Date and time, Expires date and time');
    it('presses the create pat button and listens for the copy Pat dialog and for the backend call createPat');
    it('presses the delete pat button listens for the confirmation popup');
    it('renders the delete pat confirmation popup and presses the OK button. It listens for the delete pat backend call. It expects the popup to vanish');
    it('renders the delete pat confirmation popup and presses the cancel button. It expects the popup to vanish.');
});
