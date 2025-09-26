from sqlalchemy.orm import Session
from db import models
from schemas import user as user_schemas, entity as entity_schemas
from utils import security

#USER CRUD OPERATIONS

def get_user_by_email(db: Session, email: str):
    """Retrieves a user by their email address."""
    return db.query(models.User).filter(models.User.email == email).first()

def create_user(db: Session, user: user_schemas.UserCreate, role_name: str = "user"):
    """
    Creates a new user, hashes the password, and assigns a role.
    """
    # Hash the password
    hashed_password = security.get_password_hash(user.password)
    
    # Get the role_id (defaults to "user" if role_name is not specified)
    role = db.query(models.Role).filter(models.Role.name == role_name).first()
    
    db_user = models.User(
        email=user.email,
        hashed_password=hashed_password,
        role_id=role.id if role else 1  # Fallback to role_id=1 if lookup fails
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

#TASK CRUD OPERATIONS (Secondary Entity)

def create_task(db: Session, task: entity_schemas.TaskCreate, user_id: int):
    """Creates a new task associated with a specific user."""
    db_task = models.Task(**task.model_dump(), owner_id=user_id)
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task

def get_tasks(db: Session, user_id: int, skip: int = 0, limit: int = 100):
    """Retrieves tasks for a specific user."""
    # Admins should see all tasks, regular users only their own
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user and user.role.name == "admin":
        return db.query(models.Task).offset(skip).limit(limit).all()
    else:
        return db.query(models.Task).filter(models.Task.owner_id == user_id).offset(skip).limit(limit).all()

def get_task(db: Session, task_id: int):
    """Retrieves a single task by ID."""
    return db.query(models.Task).filter(models.Task.id == task_id).first()

def update_task(db: Session, task_id: int, task: entity_schemas.TaskUpdate):
    """Updates an existing task."""
    db_task = get_task(db, task_id=task_id)
    if db_task:
        for key, value in task.model_dump(exclude_unset=True).items():
            setattr(db_task, key, value)
        db.commit()
        db.refresh(db_task)
    return db_task

def delete_task(db: Session, task_id: int):
    """Deletes a task by ID."""
    db_task = get_task(db, task_id=task_id)
    if db_task:
        db.delete(db_task)
        db.commit()
        return True
    return False