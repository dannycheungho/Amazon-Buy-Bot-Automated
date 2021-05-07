from amazoncaptcha import AmazonCaptcha

import sys

link = sys.argv[1]

captcha = AmazonCaptcha.fromlink(link)
solution = captcha.solve()

print(solution)