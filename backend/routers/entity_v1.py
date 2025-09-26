from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from db.database import get_db
from db import crud
from schemas import entity as entity_schemas
from utils.auth import get_current_user, require_role
from db.models import User as DBUser 


router = APIRouter(
    prefix="/v1/tasks",
    tags=["Tasks (V1)"],
)

#GET (READ)
@router.get("/", response_model=List[entity_schemas.Task])
def retrieve_tasks(
    db: Session = Depends(get_db),
    # Protect the route using JWT (any logged-in user)
    current_user: DBUser = Depends(get_current_user), 
    skip: int = 0, 
    limit: int = 100
):
    """
    Retrieves all tasks of that particular user. Admins can see all tasks.
    """
    tasks = crud.get_tasks(db, user_id=current_user.id, skip=skip, limit=limit)
    return tasks

@router.get("/{task_id}", response_model=entity_schemas.Task)
def read_task(
    task_id: int, 
    db: Session = Depends(get_db), 
    current_user: DBUser = Depends(get_current_user)
):
    """
    Retrieves a single task by ID. Requires ownership or admin privileges.
    """
    db_task = crud.get_task(db, task_id=task_id)
    if db_task is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    
    # Authorization Check (Only owner or admin can view)
    if db_task.owner_id != current_user.id and current_user.role_name != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to view this task")
        
    return db_task

#POST (CREATE)
@router.post("/", response_model=entity_schemas.Task, status_code=status.HTTP_201_CREATED)
def create_task_for_user(
    task: entity_schemas.TaskCreate, 
    db: Session = Depends(get_db), 
    current_user: DBUser = Depends(get_current_user)
):
    """
    Creates a new task associated with the logged-in user.
    """
    return crud.create_task(db=db, task=task, user_id=current_user.id)


#PUT/PATCH (UPDATE)
@router.patch("/{task_id}", response_model=entity_schemas.Task)
def update_task_endpoint(
    task_id: int,
    task_update: entity_schemas.TaskUpdate,
    db: Session = Depends(get_db),
    current_user: DBUser = Depends(get_current_user)
):
    """
    Updates a task. Requires ownership or admin privileges.
    """
    db_task = crud.get_task(db, task_id=task_id)
    if db_task is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
        
    # Authorization Check (Only owner or admin can update)
    if db_task.owner_id != current_user.id and current_user.role_name != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to update this task")
        
    updated_task = crud.update_task(db, task_id, task_update)
    if not updated_task:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to update task")
        
    return updated_task

#DELETE
@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task_endpoint(
    task_id: int, 
    db: Session = Depends(get_db),
    current_user: DBUser = Depends(get_current_user)
):
    """
    Deletes a task. Requires admin role.
   """
    # RBAC Check: Only Admin can delete
    if current_user.role_name != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only administrators can delete tasks")

    if not crud.delete_task(db, task_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
        
    return