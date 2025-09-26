from pydantic import BaseModel
from datetime import datetime

#  Base Schemas 

class TaskBase(BaseModel):
    title: str | None = None
    description: str | None = None
    is_completed: bool | None = False

#  Schemas for Request Bodies 

class TaskCreate(TaskBase):
    title: str  # Make title required on creation

class TaskUpdate(TaskBase):
    # Allows partial updates (no fields required)
    pass

#  Response Schemas (Read) 

class Task(TaskBase):
    id: int
    owner_id: int
    created_at: datetime

    class Config:
        from_attributes = True