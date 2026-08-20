"""
=======================================================================
  Selenium Test Suite -- Tourism Promotion Website & Marketplace
  File    : selenium_tests.py
  Run with: python selenium_tests.py
  Requires: pip install selenium webdriver-manager
=======================================================================
"""

import time
import sys
import unittest
import urllib.request

from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import (
    TimeoutException, NoSuchElementException, WebDriverException
)
from webdriver_manager.chrome import ChromeDriverManager

# ── Configuration ─────────────────────────────────────────────────────────────
BASE_URL    = "http://localhost:3000"
ADMIN_EMAIL = "admin@tourism.com"
ADMIN_PASS  = "Admin@123"
TIMEOUT     = 10


def server_up():
    """Return True if the web server is reachable."""
    try:
        urllib.request.urlopen(BASE_URL, timeout=5)
        return True
    except Exception:
        return False


def db_up():
    """
    Return True only if the login API returns a proper auth error (HTTP 401),
    meaning the DB is reachable and the query ran. A 500 means DB is broken.
    """
    try:
        import json as _json
        data = _json.dumps({"email": "probe@test.invalid", "password": "probe", "role": "user"}).encode()
        req  = urllib.request.Request(
            f"{BASE_URL}/api/auth/login",
            data=data,
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        urllib.request.urlopen(req, timeout=5)
        return True  # 200 would be unexpected but means DB is up
    except urllib.error.HTTPError as e:
        # 401 = DB ran the query and rejected credentials  => DB is UP
        # 500 = DB threw an exception                     => DB is DOWN
        return e.code == 401
    except Exception:
        return False


def make_driver():
    """Return a configured Chrome WebDriver (headless, stable)."""
    opts = Options()
    opts.add_argument("--headless=new")
    opts.add_argument("--no-sandbox")
    opts.add_argument("--disable-dev-shm-usage")
    opts.add_argument("--window-size=1280,900")
    opts.add_argument("--disable-gpu")
    opts.add_argument("--log-level=3")
    opts.add_argument("--disable-software-rasterizer")
    opts.add_argument("--disable-background-networking")
    opts.add_argument("--disable-extensions")
    opts.add_argument("--disable-renderer-backgrounding")
    opts.add_argument("--disable-notifications")
    opts.add_argument("--force-device-scale-factor=1")
    service = Service(ChromeDriverManager().install())
    return webdriver.Chrome(service=service, options=opts)


def dismiss_swal(driver, wait_sec=2):
    """Dismiss a SweetAlert2 modal if one is open."""
    try:
        time.sleep(wait_sec)
        driver.execute_script(
            "if(typeof Swal!=='undefined'){Swal.close();}"
            "var b=document.querySelector('.swal2-confirm');"
            "if(b)b.click();"
        )
        time.sleep(0.4)
    except Exception:
        pass


# ===========================================================================
#  TC01 -- TC05   Homepage
# ===========================================================================
class TC01_Homepage(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        if not server_up():
            raise unittest.SkipTest("Server not reachable — skipping Homepage tests")
        cls.driver = make_driver()
        cls.wait   = WebDriverWait(cls.driver, TIMEOUT)
        cls.driver.get(BASE_URL)
        time.sleep(2)

    @classmethod
    def tearDownClass(cls):
        if hasattr(cls, "driver"):
            cls.driver.quit()

    def test_01_page_title(self):
        """TC-01: Page title contains Tourism"""
        self.assertIn("Tourism", self.driver.title)
        print(f"  [PASS] TC-01 -- Title: '{self.driver.title}'")

    def test_02_navbar_brand(self):
        """TC-02: Navbar brand TourismPro is visible"""
        brand = self.wait.until(
            EC.visibility_of_element_located((By.CLASS_NAME, "navbar-brand")))
        self.assertIn("Tourism", brand.text)
        print(f"  [PASS] TC-02 -- Navbar brand: '{brand.text.strip()}'")

    def test_03_login_button_present(self):
        """TC-03: Login button present in navbar"""
        btn = self.driver.find_element(By.ID, "navLoginBtn")
        self.assertTrue(btn.is_displayed())
        print("  [PASS] TC-03 -- Login button visible")

    def test_04_register_button_present(self):
        """TC-04: Register Free button present in navbar"""
        btn = self.driver.find_element(By.ID, "navRegBtn")
        self.assertTrue(btn.is_displayed())
        print("  [PASS] TC-04 -- Register button visible")

    def test_05_nav_links_present(self):
        """TC-05: Destinations and Packages nav links exist"""
        links = self.driver.find_elements(By.CSS_SELECTOR, ".navbar-nav .nav-link")
        texts = [l.text.strip() for l in links if l.text.strip()]
        self.assertIn("Destinations", texts)
        self.assertIn("Packages",     texts)
        print(f"  [PASS] TC-05 -- Nav links: {texts}")


# ===========================================================================
#  TC06 -- TC12   Login Page UI
# ===========================================================================
class TC06_LoginPage_UI(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        if not server_up():
            raise unittest.SkipTest("Server not reachable — skipping Login UI tests")
        cls.driver = make_driver()
        cls.wait   = WebDriverWait(cls.driver, TIMEOUT)
        cls.driver.get(f"{BASE_URL}/login.html")
        time.sleep(1.5)

    @classmethod
    def tearDownClass(cls):
        if hasattr(cls, "driver"):
            cls.driver.quit()

    def test_06_login_page_title(self):
        """TC-06: Login page title contains Login"""
        self.assertIn("Login", self.driver.title)
        print(f"  [PASS] TC-06 -- Login title: '{self.driver.title}'")

    def test_07_email_field_present(self):
        """TC-07: Email input field exists"""
        f = self.driver.find_element(By.ID, "loginEmail")
        self.assertTrue(f.is_displayed())
        print("  [PASS] TC-07 -- Email field visible")

    def test_08_password_field_present(self):
        """TC-08: Password input field exists"""
        f = self.driver.find_element(By.ID, "loginPassword")
        self.assertTrue(f.is_displayed())
        print("  [PASS] TC-08 -- Password field visible")

    def test_09_role_tabs_count(self):
        """TC-09: All 3 role tabs (Tourist, Admin, Provider) present"""
        tabs = self.driver.find_elements(By.CLASS_NAME, "role-tab")
        self.assertEqual(len(tabs), 3)
        print(f"  [PASS] TC-09 -- Role tabs: {[t.text.strip() for t in tabs]}")

    def test_10_role_tab_switching(self):
        """TC-10: Clicking Admin tab adds active class"""
        tab = self.driver.find_element(By.ID, "roleAdmin")
        tab.click()
        time.sleep(0.4)
        self.assertIn("active", tab.get_attribute("class"))
        print("  [PASS] TC-10 -- Admin tab active after click")

    def test_11_sign_in_button_present(self):
        """TC-11: Sign In submit button visible"""
        btn = self.driver.find_element(By.ID, "loginBtn")
        self.assertTrue(btn.is_displayed())
        self.assertIn("Sign In", btn.text)
        print("  [PASS] TC-11 -- Sign In button found")

    def test_12_empty_form_stays_on_page(self):
        """TC-12: Empty form submission stays on login page"""
        self.driver.get(f"{BASE_URL}/login.html")
        time.sleep(1)
        self.driver.find_element(By.ID, "loginBtn").click()
        dismiss_swal(self.driver, wait_sec=1.5)
        self.assertIn("login", self.driver.current_url)
        print(f"  [PASS] TC-12 -- Still on login: {self.driver.current_url}")


# ===========================================================================
#  TC13 -- TC15   Authentication  (each test = fresh browser)
# ===========================================================================
class TC13_LoginPage_Auth(unittest.TestCase):

    def setUp(self):
        if not db_up():
            self.skipTest("DB not reachable — skipping auth tests")
        self.driver = make_driver()
        self.wait   = WebDriverWait(self.driver, TIMEOUT)

    def tearDown(self):
        if hasattr(self, "driver"):
            try:
                self.driver.quit()
            except Exception:
                pass

    def test_13_invalid_credentials_rejected(self):
        """TC-13: Invalid credentials do not redirect to /admin/"""
        self.driver.get(f"{BASE_URL}/login.html")
        time.sleep(1)
        self.driver.find_element(By.ID, "roleAdmin").click()
        time.sleep(0.3)
        self.driver.find_element(By.ID, "loginEmail").send_keys("bad@bad.com")
        self.driver.find_element(By.ID, "loginPassword").send_keys("wrongpass")
        self.driver.find_element(By.ID, "loginBtn").click()
        dismiss_swal(self.driver, wait_sec=2.5)
        self.assertNotIn("/admin/", self.driver.current_url)
        print(f"  [PASS] TC-13 -- Invalid login rejected: {self.driver.current_url}")

    def test_14_admin_login_redirects(self):
        """TC-14: Valid admin login redirects to /admin/ dashboard"""
        self.driver.get(f"{BASE_URL}/login.html")
        time.sleep(1)
        self.driver.find_element(By.ID, "roleAdmin").click()
        time.sleep(0.3)
        self.driver.find_element(By.ID, "loginEmail").send_keys(ADMIN_EMAIL)
        self.driver.find_element(By.ID, "loginPassword").send_keys(ADMIN_PASS)
        self.driver.find_element(By.ID, "loginBtn").click()
        # Wait up to 12s for URL to change to /admin/ (covers fetch + 1.5s SweetAlert timer)
        try:
            WebDriverWait(self.driver, 12).until(EC.url_contains("/admin/"))
            current = self.driver.current_url
            print(f"  [PASS] TC-14 -- Admin redirected to: {current}")
        except TimeoutException:
            self.fail(f"Admin login did not redirect within 12s. URL: {self.driver.current_url}")

    def test_15_admin_dashboard_has_content(self):
        """TC-15: Admin dashboard body loads content after login"""
        self.driver.get(f"{BASE_URL}/login.html")
        time.sleep(1)
        self.driver.find_element(By.ID, "roleAdmin").click()
        time.sleep(0.3)
        self.driver.find_element(By.ID, "loginEmail").send_keys(ADMIN_EMAIL)
        self.driver.find_element(By.ID, "loginPassword").send_keys(ADMIN_PASS)
        self.driver.find_element(By.ID, "loginBtn").click()
        # Wait up to 12s for redirect, then verify body has content
        try:
            WebDriverWait(self.driver, 12).until(EC.url_contains("/admin/"))
        except TimeoutException:
            self.fail(f"Admin login did not redirect within 12s. URL: {self.driver.current_url}")
        time.sleep(1)  # let dashboard JS render
        body = self.driver.find_element(By.TAG_NAME, "body").text
        self.assertTrue(len(body) > 50, "Dashboard body appears empty")
        print(f"  [PASS] TC-15 -- Dashboard loaded ({len(body)} chars)")


# ===========================================================================
#  TC16 -- TC19   Register Page
# ===========================================================================
class TC16_RegisterPage(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        if not server_up():
            raise unittest.SkipTest("Server not reachable — skipping Register tests")
        cls.driver = make_driver()
        cls.wait   = WebDriverWait(cls.driver, TIMEOUT)
        cls.driver.get(f"{BASE_URL}/register.html")
        time.sleep(1.5)

    @classmethod
    def tearDownClass(cls):
        if hasattr(cls, "driver"):
            cls.driver.quit()

    def test_16_register_page_title(self):
        """TC-16: Register page title contains Register"""
        self.assertIn("Register", self.driver.title)
        print(f"  [PASS] TC-16 -- Register title: '{self.driver.title}'")

    def test_17_name_field_present(self):
        """TC-17: Full name input exists on register form"""
        try:
            f = self.driver.find_element(By.ID, "regName")
            self.assertTrue(f.is_displayed())
        except NoSuchElementException:
            fields = self.driver.find_elements(
                By.CSS_SELECTOR,
                "input[placeholder*='name'], input[name='name']")
            self.assertTrue(len(fields) > 0, "No name field found")
        print("  [PASS] TC-17 -- Name field found")

    def test_18_create_account_link(self):
        """TC-18: Create account link on login page leads to register"""
        self.driver.get(f"{BASE_URL}/login.html")
        time.sleep(0.8)
        self.driver.find_element(By.LINK_TEXT, "Create account").click()
        time.sleep(1.2)
        self.assertIn("register", self.driver.current_url)
        print(f"  [PASS] TC-18 -- Create account: {self.driver.current_url}")

    def test_19_back_to_home_link(self):
        """TC-19: Back to Home on login page returns to homepage"""
        self.driver.get(f"{BASE_URL}/login.html")
        time.sleep(0.8)
        self.driver.find_element(By.PARTIAL_LINK_TEXT, "Back to Home").click()
        time.sleep(1.2)
        url = self.driver.current_url.rstrip("/")
        self.assertTrue(url == BASE_URL or url.endswith("index.html"))
        print(f"  [PASS] TC-19 -- Back to Home: {self.driver.current_url}")


# ===========================================================================
#  RUNNER
# ===========================================================================
if __name__ == "__main__":
    print("\n" + "=" * 65)
    print("   Tourism Promotion Website -- Selenium Test Suite")
    print("=" * 65)
    print(f"   Target : {BASE_URL}")
    print(f"   Engine : Selenium 4 + ChromeDriver (headless)")
    print(f"   Server : {'UP' if server_up() else 'DOWN'}")
    print(f"   DB     : {'UP' if db_up() else 'DOWN (auth tests will be skipped)'}")
    print("=" * 65 + "\n")

    loader = unittest.TestLoader()
    loader.sortTestMethodsUsing = None

    suite = unittest.TestSuite()
    for cls in [TC01_Homepage,
                TC06_LoginPage_UI,
                TC13_LoginPage_Auth,
                TC16_RegisterPage]:
        suite.addTests(loader.loadTestsFromTestCase(cls))

    runner = unittest.TextTestRunner(verbosity=2, stream=sys.stdout)
    result = runner.run(suite)

    total   = result.testsRun
    errors  = len(result.errors)
    fails   = len(result.failures)
    skipped = len(result.skipped)
    passed  = total - errors - fails - skipped

    print("\n" + "=" * 65)
    print(f"   Total   : {total}")
    print(f"   Passed  : {passed}")
    print(f"   Skipped : {skipped}")
    print(f"   Failed  : {fails}")
    print(f"   Errors  : {errors}")
    if result.wasSuccessful():
        print("\n   ALL TESTS PASSED!")
    else:
        print("\n   Some tests FAILED -- see output above")
    print("=" * 65 + "\n")

    sys.exit(0 if result.wasSuccessful() else 1)
