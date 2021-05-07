
/*isAddedToCart = (url) => {
    return /https:\/\/www\.amazon\.com\/gp\/product\/handle-buy-box/.test(url);
}*/

isInDpPage = (url) => {
    return /https:\/\/www\.amazon\.com\/dp/.test(url);
}

isCheckoutPage = (url) => {
    return /https:\/\/www\.amazon\.com\/gp\/buy\/spc\/handlers\/display\.html/.test(url);
}

isAddedToCart = (url) => {
    return /https:\/\/www\.amazon\.com\/gp\/huc\/view/.test(url);
}

isCaptchaPage = (content) => {
    return /https:\/\/images-na\.ssl-images-amazon\.com\/captcha\//.test(content);
}

isLoginCaptcha = (content) => {
    return /Visual CAPTCHA image/.test(content);
}
isLoadingCheckout = (url) =>{
    return /gp\/cart\/desktop\/go-to-checkout\.html\/ref=ox_sc_proceed/.test(url);
}
/*
isAddedToCart = (content) => {
    return /Added to Cart/.test(content);
}*/
isShippingAddressPage = (url) => {
    return /gp\/buy\/addressselect\/handlers\/display\.html/.test(url);
}
isshipoptionselectPage = (url) => {
    return /gp\/buy\/shipoptionselect\/handlers\/display\.html/.test(url);
}
isPaySelectPage = (url) => {
    return /payselect/.test(url);
}
///cart/desktop/go-to-checkout.html/ref=ox_sc_proceed
isAddedToCartBefore = (content) => {
    return /Not added/.test(content) || /from this seller has a limit of \d+ per customer\. We have updated your quantity of/.test(content);
}

isPlacedOrder = (url) => {
    return /\/buy\/thankyou\/handlers\/display\.html/.test(url);
   // return /Thank you, your order has been placed\./.test(content);
}

isPaymentPage = (content) => {
    return /Select a payment method/.test(content);
}

isPrimeinterstitial = (url) => {
    return /primeinterstitial/.test(url);
}

isPantryAddress = (url) => {
    return /gp\/buy\/addressselect\/handlers\/continue/.test(url);
}
isItemDispatch = (url) => {
    return /item-dispatch/.test(url);
}
isPrimeinterstitial = (url) => {
    return /primeinterstitial/.test(url);
}
isCheckoutEntryHandler = (url)=> {
    return /ref=checkout_entry_handler/.test(url);
}
