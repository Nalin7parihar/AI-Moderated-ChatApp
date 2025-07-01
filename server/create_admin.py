import secrets
import string
from sqlmodel import Session
from app.databases import engine  # Assuming your engine is here
from app.model import User
from app.utils import pwd_context

# --- Admin User Configuration ---
ADMIN_USERNAME = "admin"
ADMIN_EMAIL = "nalin@example.com"

def generate_secure_password(length=16):
    """Generates a secure random password."""
    alphabet = string.ascii_letters + string.digits + string.punctuation
    password = ''.join(secrets.choice(alphabet) for i in range(length))
    return password

def create_admin_user():
    """Creates an admin user in the database."""
    admin_password = generate_secure_password()
    hashed_password = pwd_context.hash(admin_password)

    # Assuming your User model has an 'is_admin' field.
    # If the field has a different name, please update it below.
    admin_user = User(
        name=ADMIN_USERNAME,
        email=ADMIN_EMAIL,
        password=hashed_password,
        is_admin=True  
    )

    with Session(engine) as session:
        session.add(admin_user)
        session.commit()
        session.refresh(admin_user)

    print("--- Admin User Created Successfully ---")
    print(f"Username: {ADMIN_USERNAME}")
    print(f"Password: {admin_password}")
    print("---------------------------------------")
    print("Please save this password in a secure location. It will not be shown again.")

if __name__ == "__main__":
    print("Creating admin user...")
    create_admin_user()