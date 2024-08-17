import shutil
import os
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.requests import Request

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=['*'], 
    allow_headers=['*'],
)

def include_CORS():
    response = JSONResponse({ })
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    response.headers["Access-Control-Allow-Credentials"] = "true"
    return response

app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

@app.get("/new")
async def _(request: Request):
    return templates.TemplateResponse("new.html", {"request": request})


@app.get("/video")
async def video_endpoint(request: Request, url: str):

    file_size = os.path.getsize(url)
    range_header = request.headers.get('Range', None)
    
    if range_header:
        byte1, byte2 = range_header.replace('bytes=', '').split('-')
        start = int(byte1)
        end = int(byte2) if byte2 else file_size - 1
        length = end - start + 1

        with open(url, 'rb') as video:
            video.seek(start)
            data = video.read(length)
            headers = {
                'Content-Range': f'bytes {start}-{end}/{file_size}',
                'Accept-Ranges': 'bytes',
                'Content-Length': str(length),
                'Content-Type': 'video/mp4',
            }

            return Response(content=data, status_code=206, headers=headers)
        
    raise HTTPException(status_code=416, detail="Range Not Satisfiable")
    

@app.get("/play")
async def _(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.post("/upload")
async def _(video: UploadFile = File(...)):
    path = f'static/media/{video.filename}'
    with open(path, "wb") as buffer:
        shutil.copyfileobj(video.file, buffer)
    return include_CORS()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="185.204.3.17", port=8000)

# 185.204.3.17