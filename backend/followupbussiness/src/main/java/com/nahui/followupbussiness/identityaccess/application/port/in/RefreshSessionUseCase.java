package com.nahui.followupbussiness.identityaccess.application.port.in;
import com.nahui.followupbussiness.identityaccess.application.RefreshService;
public interface RefreshSessionUseCase { RefreshService.Result refresh(RefreshService.Command command); }
