import React from "react";

export default function MyTasks({ tasks, updateTaskStatus }) {
  return (
    <div className="animate-fade-in h-[calc(100vh-140px)] flex flex-col">
      <div className="mb-6">
        <h3 className="font-display text-2xl font-bold text-slate-900">Task Board</h3>
        <p className="text-xs text-slate-500 mt-1">Drag and drop tickets to update your operational status.</p>
      </div>

      <div className="flex-1 flex gap-6 overflow-x-auto pb-4 custom-scrollbar">
        {/* Board Columns Mapping */}
        {["Pending", "In Progress", "Completed"].map((statusOption) => (
          <div 
            key={statusOption}
            className="flex-shrink-0 w-80 flex flex-col bg-slate-100/50 rounded-xl border border-slate-200/60"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              const taskId = e.dataTransfer.getData("taskId");
              if (taskId) updateTaskStatus(taskId, statusOption);
            }}
          >
            {/* Column Header */}
            <div className="p-4 border-b border-slate-200/60 flex justify-between items-center bg-white/50 rounded-t-xl">
              <div className="text-xs font-black uppercase tracking-widest text-slate-700">{statusOption}</div>
              <div className="bg-slate-200 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                {tasks.filter(t => t.status === statusOption).length}
              </div>
            </div>

            {/* Column Body (Draggable Cards) */}
            <div className="flex-1 p-3 space-y-3 overflow-y-auto">
              {tasks.filter(t => t.status === statusOption).map(task => (
                <div 
                  key={task.id}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData("taskId", task.id)}
                  className="bg-white p-4 rounded-lg shadow-sm border border-slate-200/80 cursor-grab active:cursor-grabbing hover:border-blue-400 hover:shadow-md transition-all group"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${statusOption === 'Completed' ? 'bg-green-100 text-green-700' : statusOption === 'In Progress' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                      {statusOption}
                    </span>
                    <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider bg-red-50 px-1.5 py-0.5 rounded">
                      Due: {task.deadline}
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 mb-1 leading-snug">{task.title}</h4>
                  <p className="text-xs text-slate-500 line-clamp-3 mb-3">{task.description}</p>
                  <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest border-t border-slate-100 pt-2 flex items-center gap-1">
                    <span>Assigned by:</span> <span className="text-slate-700">{task.assignedBy}</span>
                  </div>
                </div>
              ))}
              {tasks.filter(t => t.status === statusOption).length === 0 && (
                <div className="h-24 border-2 border-dashed border-slate-200 rounded-lg flex items-center justify-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Drop Here
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
