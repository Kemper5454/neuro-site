
const flowBaseCookie = async(a, b, c, e = 182) => {
  // hide the cookie block div
  $(a).hide();

  // validate the params provided
  await validateParams(a, b, c, e)


  // create the cookie
  $(b).on('click', () => {
    let date = new Date();
    const expiresTime = e * 86400000; // calc milliseconds in days
    date.setTime(date.getTime() + expiresTime); // set the cookie expires time
    document.cookie = "cookieConsent=accepted; expires=" + date.toGMTString() + "; path=/"; // create the cookie
    $(a).remove(); // remove the cookie block
  })

  //clear the cookie
  $(c).click(() => document.cookie = 'cookieConsent=; expires=Thu, 01 Jan 1970 00:00:01 GMT;');

  if (!decodeURIComponent(document.cookie).includes("cookieConsent=accepted")) $(a).show()
  else $(a).remove();

};

const validateParams = (a, b, c, e) => { // validates that the inputs are correct
  if (!a, !b, !e) throw new Error('Error: Required parameter is missing');
  else if (typeof a !== "string" || typeof b !== "string" || c && typeof c !== "string") throw new Error('Error: Accept and Clear divs must be strings');
  else if (typeof e !== "number") throw new Error('Error: Expiry days must be a number only');
  else return true;
}
